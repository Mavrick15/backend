const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  confirmPayment,
  getPaymentStatus,
  cancelPayment,
  getUserPayments,
} = require('../controllers/paymentController');

// Initier un paiement Mobile Money
router.post('/', initiatePayment);

// Récupérer l'historique des paiements de l'utilisateur
router.get('/', getUserPayments);

// Vérifier le statut d'un paiement
router.get('/:paymentId', getPaymentStatus);

// Confirmer un paiement (entrer le code de transaction)
router.put('/:paymentId/confirm', confirmPayment);

// Annuler un paiement en attente
router.put('/:paymentId/cancel', cancelPayment);

module.exports = router;
