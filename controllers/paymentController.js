const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { logger } = require('../log/logger');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const MESSAGES = {
  TOKEN_MISSING: 'Authentification requise. Veuillez vous connecter pour effectuer un paiement.',
  TOKEN_INVALID: 'Session expirée ou invalide. Veuillez vous reconnecter.',
  USER_NOT_FOUND: 'Compte utilisateur introuvable.',
  INVOICE_NOT_FOUND: 'Facture introuvable. Veuillez vérifier votre numéro de facture.',
  INVOICE_ALREADY_PAID: 'Cette facture a déjà été payée.',
  INVOICE_CANCELLED: 'Cette facture a été annulée et ne peut plus être payée.',
  INVALID_PROVIDER: 'Fournisseur Mobile Money invalide. Choisissez parmi : M-Pesa, Orange Money, Airtel Money ou Africell Money.',
  INVALID_PHONE: 'Numéro de téléphone Mobile Money invalide.',
  INVALID_INVOICE_ID: 'ID de facture invalide.',
  INVALID_PAYMENT_ID: 'ID de paiement invalide.',
  PAYMENT_INITIATED: 'Paiement Mobile Money initié avec succès. Suivez les instructions pour compléter le paiement.',
  PAYMENT_NOT_FOUND: 'Paiement introuvable.',
  PAYMENT_CONFIRMED: 'Paiement confirmé avec succès ! Votre inscription est validée.',
  PAYMENT_ALREADY_CONFIRMED: 'Ce paiement a déjà été confirmé.',
  PAYMENT_EXPIRED: 'Ce paiement a expiré. Veuillez initier un nouveau paiement.',
  PAYMENT_CANCELLED: 'Paiement annulé avec succès.',
  PAYMENT_STATUS_FETCHED: 'Statut du paiement récupéré.',
  PAYMENTS_FETCHED: 'Historique des paiements récupéré.',
  UNAUTHORIZED: 'Non autorisé à accéder à ce paiement.',
  PROVIDER_TRANSACTION_REQUIRED: 'Veuillez entrer le code de transaction reçu par SMS de votre opérateur.',
};

const LOG_MESSAGES = {
  INFO_PAYMENT_INITIATED: (ref, provider, userName) =>
    `Paiement ${ref} initié via ${provider} par ${userName}`,
  INFO_PAYMENT_CONFIRMED: (ref, userName) =>
    `Paiement ${ref} confirmé par ${userName}`,
  INFO_PAYMENT_CANCELLED: (ref) =>
    `Paiement ${ref} annulé`,
  WARN_INVOICE_NOT_FOUND: (id) =>
    `Facture non trouvée pour paiement: ${id}`,
  WARN_PAYMENT_NOT_FOUND: (id) =>
    `Paiement non trouvé: ${id}`,
  ERROR_PAYMENT_OPERATION: 'Erreur lors de l\'opération de paiement:',
};

const VALID_PROVIDERS = ['mpesa', 'orange_money', 'airtel_money', 'africell_money'];

/**
 * Extraire et vérifier le token JWT
 */
const authenticateFromToken = async (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return { error: MESSAGES.TOKEN_MISSING, status: 401 };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return { error: MESSAGES.USER_NOT_FOUND, status: 404 };
    return { user };
  } catch {
    return { error: MESSAGES.TOKEN_INVALID, status: 401 };
  }
};

/**
 * Initier un paiement Mobile Money
 */
const initiatePayment = async (req, res, next) => {
  try {
    const auth = await authenticateFromToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }
    const { user } = auth;

    const { invoiceId, provider, phoneNumber } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_INVOICE_ID });
    }

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_PROVIDER });
    }

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_PHONE });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      logger.warn(LOG_MESSAGES.WARN_INVOICE_NOT_FOUND(invoiceId));
      return res.status(404).json({ success: false, message: MESSAGES.INVOICE_NOT_FOUND });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: MESSAGES.INVOICE_ALREADY_PAID });
    }

    if (invoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: MESSAGES.INVOICE_CANCELLED });
    }

    // Générer la référence de transaction unique
    let transactionReference;
    let isUnique = false;
    while (!isUnique) {
      transactionReference = Payment.generateTransactionReference();
      const existing = await Payment.findOne({ transactionReference });
      if (!existing) isUnique = true;
    }

    const paymentInstructions = Payment.getProviderInstructions(
      provider,
      phoneNumber,
      invoice.total,
      transactionReference
    );

    const payment = await Payment.create({
      invoice: invoice._id,
      user: user._id,
      provider,
      phoneNumber: phoneNumber.trim(),
      amount: invoice.total,
      currency: 'USD',
      status: 'pending',
      transactionReference,
      paymentInstructions,
    });

    // Mettre à jour la facture avec la méthode de paiement
    invoice.paymentMethod = 'mobile_money';
    invoice.paymentReference = transactionReference;
    await invoice.save();

    logger.info(LOG_MESSAGES.INFO_PAYMENT_INITIATED(transactionReference, provider, user.name), {
      paymentId: payment._id,
      invoiceId: invoice._id,
      provider,
      amount: invoice.total,
    });

    res.status(201).json({
      success: true,
      message: MESSAGES.PAYMENT_INITIATED,
      payment: {
        _id: payment._id,
        transactionReference: payment.transactionReference,
        provider: payment.provider,
        providerDisplayName: Payment.getProviderDisplayName(provider),
        phoneNumber: payment.phoneNumber,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentInstructions: payment.paymentInstructions,
        expiresAt: payment.expiresAt,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_PAYMENT_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Confirmer un paiement (l'utilisateur entre le code de transaction reçu par SMS)
 */
const confirmPayment = async (req, res, next) => {
  try {
    const auth = await authenticateFromToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }
    const { user } = auth;

    const { paymentId } = req.params;
    const { providerTransactionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_PAYMENT_ID });
    }

    if (!providerTransactionId || providerTransactionId.trim().length < 4) {
      return res.status(400).json({ success: false, message: MESSAGES.PROVIDER_TRANSACTION_REQUIRED });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      logger.warn(LOG_MESSAGES.WARN_PAYMENT_NOT_FOUND(paymentId));
      return res.status(404).json({ success: false, message: MESSAGES.PAYMENT_NOT_FOUND });
    }

    if (payment.user.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ success: false, message: MESSAGES.PAYMENT_ALREADY_CONFIRMED });
    }

    if (payment.expiresAt && new Date() > payment.expiresAt) {
      payment.status = 'expired';
      await payment.save();
      return res.status(400).json({ success: false, message: MESSAGES.PAYMENT_EXPIRED });
    }

    // Marquer le paiement comme complété
    payment.status = 'completed';
    payment.providerTransactionId = providerTransactionId.trim();
    payment.confirmedAt = new Date();
    await payment.save();

    // Mettre à jour la facture comme payée
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
      invoice.paymentDate = new Date();
      invoice.paymentReference = payment.transactionReference;
      await invoice.save();
    }

    logger.info(LOG_MESSAGES.INFO_PAYMENT_CONFIRMED(payment.transactionReference, user.name), {
      paymentId: payment._id,
      providerTransactionId,
    });

    res.status(200).json({
      success: true,
      message: MESSAGES.PAYMENT_CONFIRMED,
      payment: {
        _id: payment._id,
        transactionReference: payment.transactionReference,
        provider: payment.provider,
        providerDisplayName: Payment.getProviderDisplayName(payment.provider),
        providerTransactionId: payment.providerTransactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        confirmedAt: payment.confirmedAt,
      },
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_PAYMENT_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Vérifier le statut d'un paiement
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const auth = await authenticateFromToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }
    const { user } = auth;

    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_PAYMENT_ID });
    }

    const payment = await Payment.findById(paymentId).populate('invoice', 'invoiceNumber total status');
    if (!payment) {
      return res.status(404).json({ success: false, message: MESSAGES.PAYMENT_NOT_FOUND });
    }

    if (payment.user.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    // Vérifier l'expiration
    if (payment.status === 'pending' && payment.expiresAt && new Date() > payment.expiresAt) {
      payment.status = 'expired';
      await payment.save();
    }

    res.status(200).json({
      success: true,
      message: MESSAGES.PAYMENT_STATUS_FETCHED,
      payment: {
        _id: payment._id,
        transactionReference: payment.transactionReference,
        provider: payment.provider,
        providerDisplayName: Payment.getProviderDisplayName(payment.provider),
        phoneNumber: payment.phoneNumber,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentInstructions: payment.paymentInstructions,
        providerTransactionId: payment.providerTransactionId,
        confirmedAt: payment.confirmedAt,
        expiresAt: payment.expiresAt,
        invoice: payment.invoice,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_PAYMENT_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Annuler un paiement en attente
 */
const cancelPayment = async (req, res, next) => {
  try {
    const auth = await authenticateFromToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }
    const { user } = auth;

    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_PAYMENT_ID });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: MESSAGES.PAYMENT_NOT_FOUND });
    }

    if (payment.user.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ success: false, message: MESSAGES.PAYMENT_ALREADY_CONFIRMED });
    }

    payment.status = 'cancelled';
    await payment.save();

    logger.info(LOG_MESSAGES.INFO_PAYMENT_CANCELLED(payment.transactionReference));

    res.status(200).json({
      success: true,
      message: MESSAGES.PAYMENT_CANCELLED,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_PAYMENT_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Récupérer l'historique des paiements d'un utilisateur
 */
const getUserPayments = async (req, res, next) => {
  try {
    const auth = await authenticateFromToken(req);
    if (auth.error) {
      return res.status(auth.status).json({ success: false, message: auth.error });
    }
    const { user } = auth;

    const { status, limit = 10, offset = 0 } = req.query;
    const query = { user: user._id };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('invoice', 'invoiceNumber total status');

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      message: MESSAGES.PAYMENTS_FETCHED,
      payments,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_PAYMENT_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

module.exports = {
  initiatePayment,
  confirmPayment,
  getPaymentStatus,
  cancelPayment,
  getUserPayments,
};
