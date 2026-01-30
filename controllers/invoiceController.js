const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Formation = require('../models/Formation');
const Enrollment = require('../models/Enrollment');
const { logger } = require('../log/logger');
const { sendInvoiceConfirmationEmail } = require('./emailService');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const MESSAGES = {
  TOKEN_MISSING: 'Non autorisé : Token manquant.',
  TOKEN_INVALID: 'Non autorisé : Token invalide.',
  USER_NOT_FOUND: 'Utilisateur non trouvé.',
  FORMATION_NOT_FOUND: (id) => `Formation non trouvée: ${id}`,
  INVALID_ITEMS: 'La facture doit contenir au moins un article.',
  INVOICE_CREATED: 'Facture créée avec succès.',
  INVOICE_NOT_FOUND: 'Facture non trouvée.',
  INVOICE_FETCHED: 'Factures récupérées avec succès.',
  INVOICE_UPDATED: 'Facture mise à jour avec succès.',
  UNAUTHORIZED: 'Non autorisé à accéder à cette facture.',
};

const LOG_MESSAGES = {
  INFO_INVOICE_CREATION_START: (userName) => `Création de facture pour l'utilisateur: ${userName}`,
  INFO_INVOICE_CREATED: (invoiceNumber, userName) => `Facture ${invoiceNumber} créée pour ${userName}`,
  WARN_FORMATION_NOT_FOUND: (formationId) => `Formation non trouvée: ${formationId}`,
  ERROR_INVOICE_CREATION: 'Erreur lors de la création de la facture:',
  INFO_INVOICES_FETCHED: (userId) => `Factures récupérées pour l'utilisateur: ${userId}`,
  INFO_INVOICE_FETCHED: (invoiceNumber) => `Facture récupérée: ${invoiceNumber}`,
  WARN_INVOICE_NOT_FOUND: (invoiceId) => `Facture non trouvée: ${invoiceId}`,
  ERROR_INVOICE_FETCH: 'Erreur lors de la récupération de la facture:',
};

/**
 * Créer une nouvelle facture
 */
const createInvoice = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, message: MESSAGES.TOKEN_MISSING });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: MESSAGES.TOKEN_INVALID });
    }

    const userId = decodedToken.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: MESSAGES.USER_NOT_FOUND });
    }

    const { items, clientInfo, paymentMethod, notes, tax = 0, discount = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: MESSAGES.INVALID_ITEMS });
    }

    logger.info(LOG_MESSAGES.INFO_INVOICE_CREATION_START(user.name), { userId, itemsCount: items.length });

    // Vérifier que toutes les formations existent
    const formationIds = items.map(item => item.formationId || item._id);
    const formations = await Formation.find({ _id: { $in: formationIds } });
    
    if (formations.length !== formationIds.length) {
      const foundIds = formations.map(f => f._id.toString());
      const missingIds = formationIds.filter(id => !foundIds.includes(id.toString()));
      logger.warn(LOG_MESSAGES.WARN_FORMATION_NOT_FOUND(missingIds.join(', ')));
      return res.status(404).json({ 
        success: false, 
        message: MESSAGES.FORMATION_NOT_FOUND(missingIds.join(', ')) 
      });
    }

    // Préparer les items de la facture avec les données complètes
    const invoiceItems = items.map(item => {
      const formation = formations.find(f => 
        f._id.toString() === (item.formationId || item._id).toString()
      );
      return {
        formationId: formation._id,
        title: item.title || formation.title,
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || formation.price,
        quantity: item.quantity || 1,
      };
    });

    // Générer le numéro de facture
    let invoiceNumber;
    let isUnique = false;
    while (!isUnique) {
      invoiceNumber = Invoice.generateInvoiceNumber();
      const existing = await Invoice.findOne({ invoiceNumber });
      if (!existing) {
        isUnique = true;
      }
    }

    // Créer la facture
    const invoice = new Invoice({
      invoiceNumber,
      user: userId,
      items: invoiceItems,
      clientInfo: {
        name: clientInfo.name || user.name,
        email: clientInfo.email || user.email,
        phone: clientInfo.phone || '',
        address: {
          street: clientInfo.address?.street || clientInfo.address || '',
          city: clientInfo.address?.city || clientInfo.city || '',
          postalCode: clientInfo.address?.postalCode || clientInfo.postalCode || '',
          country: clientInfo.address?.country || clientInfo.country || '',
        },
      },
      paymentMethod: paymentMethod || 'other',
      tax: tax || 0,
      discount: discount || 0,
      notes: notes || '',
    });

    // Calculer le total
    invoice.calculateTotal();
    await invoice.save();

    // Créer les inscriptions pour chaque formation
    const enrollments = [];
    for (const item of invoiceItems) {
      try {
        // Vérifier si l'utilisateur n'est pas déjà inscrit
        const existingEnrollment = await Enrollment.findOne({ 
          user: userId, 
          formation: item.formationId 
        });

        if (!existingEnrollment) {
          const formation = await Formation.findById(item.formationId);
          if (formation && formation.seats > 0) {
            // Sauvegarder le nombre de places avant décrémentation
            const seatsBeforeDecrement = formation.seats;
            
            // Décrémenter les places disponibles
            const updatedFormation = await Formation.findByIdAndUpdate(
              item.formationId, 
              { $inc: { seats: -1 } },
              { new: true }
            );
            
            if (updatedFormation) {
              // Créer l'inscription avec le nombre de places avant décrémentation
              const enrollment = await Enrollment.create({
                user: userId,
                userName: user.name,
                userEmail: user.email,
                formation: item.formationId,
                formationTitle: formation.title,
                formationDate: formation.date,
                formationLocation: formation.location,
                formationDuration: formation.duration,
                formationInstructor: formation.instructor,
                formationPrice: formation.price,
                formationSeats: seatsBeforeDecrement,
                formationLevel: formation.level,
              });
              enrollments.push(enrollment);
            }
          }
        }
      } catch (error) {
        logger.error(`Erreur lors de la création de l'inscription pour ${item.formationId}:`, error);
        // Continuer avec les autres formations même si une échoue
      }
    }

    logger.info(LOG_MESSAGES.INFO_INVOICE_CREATED(invoiceNumber, user.name), {
      invoiceId: invoice._id,
      userId,
      total: invoice.total,
      enrollmentsCount: enrollments.length,
    });

    // Envoyer un email de confirmation au client
    try {
      await sendInvoiceConfirmationEmail({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientInfo.name,
        clientEmail: invoice.clientInfo.email,
        items: invoice.items,
        total: invoice.total,
      });
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email de confirmation de facture:', error);
    }

    res.status(201).json({
      success: true,
      message: MESSAGES.INVOICE_CREATED,
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount,
        total: invoice.total,
        status: invoice.status,
        clientInfo: invoice.clientInfo,
        createdAt: invoice.createdAt,
      },
      enrollments: enrollments.map(e => ({
        _id: e._id,
        formationTitle: e.formationTitle,
      })),
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_INVOICE_CREATION, { 
      message: error.message, 
      stack: error.stack 
    });
    next(error);
  }
};

/**
 * Récupérer toutes les factures d'un utilisateur
 */
const getUserInvoices = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, limit = 10, offset = 0 } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('items.formationId', 'title');

    const total = await Invoice.countDocuments(query);

    logger.info(LOG_MESSAGES.INFO_INVOICES_FETCHED(userId), { count: invoices.length });

    res.status(200).json({
      success: true,
      message: MESSAGES.INVOICE_FETCHED,
      invoices,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_INVOICE_FETCH, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Récupérer une facture par son ID
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID de facture invalide' });
    }

    const invoice = await Invoice.findById(id)
      .populate('items.formationId')
      .populate('user', 'name email');

    if (!invoice) {
      logger.warn(LOG_MESSAGES.WARN_INVOICE_NOT_FOUND(id));
      return res.status(404).json({ success: false, message: MESSAGES.INVOICE_NOT_FOUND });
    }

    // Vérifier que l'utilisateur est propriétaire de la facture ou admin
    if (invoice.user._id.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    logger.info(LOG_MESSAGES.INFO_INVOICE_FETCHED(invoice.invoiceNumber));

    res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_INVOICE_FETCH, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Mettre à jour le statut d'une facture
 */
const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod, paymentReference, paymentDate } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID de facture invalide' });
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: MESSAGES.INVOICE_NOT_FOUND });
    }

    // Vérifier les permissions
    if (invoice.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    // Mettre à jour le statut
    if (status) {
      invoice.status = status;
      if (status === 'paid') {
        invoice.paidAt = new Date();
        invoice.paymentDate = paymentDate || new Date();
      } else if (status === 'cancelled') {
        invoice.cancelledAt = new Date();
      }
    }

    if (paymentMethod) invoice.paymentMethod = paymentMethod;
    if (paymentReference) invoice.paymentReference = paymentReference;
    if (paymentDate) invoice.paymentDate = new Date(paymentDate);

    await invoice.save();

    res.status(200).json({
      success: true,
      message: MESSAGES.INVOICE_UPDATED,
      invoice,
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour de la facture:', { message: error.message, stack: error.stack });
    next(error);
  }
};

module.exports = {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  updateInvoiceStatus,
};
