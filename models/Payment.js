const mongoose = require('mongoose');

const PAYMENT_MESSAGES = {
  REQUIRED: 'Champ requis',
  INVALID_PHONE: 'Veuillez entrer un numéro de téléphone Mobile Money valide',
  INVALID_PROVIDER: 'Fournisseur Mobile Money invalide',
  INVALID_STATUS: 'Statut de paiement invalide',
  MIN_VALUE: 'Le montant doit être positif',
};

const PAYMENT_PROVIDERS = ['mpesa', 'orange_money', 'airtel_money', 'africell_money'];
const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired'];

const paymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  provider: {
    type: String,
    enum: {
      values: PAYMENT_PROVIDERS,
      message: PAYMENT_MESSAGES.INVALID_PROVIDER,
    },
    required: [true, PAYMENT_MESSAGES.REQUIRED],
  },
  phoneNumber: {
    type: String,
    required: [true, PAYMENT_MESSAGES.REQUIRED],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, PAYMENT_MESSAGES.REQUIRED],
    min: [0, PAYMENT_MESSAGES.MIN_VALUE],
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'CDF'],
  },
  status: {
    type: String,
    enum: {
      values: PAYMENT_STATUSES,
      message: PAYMENT_MESSAGES.INVALID_STATUS,
    },
    default: 'pending',
    index: true,
  },
  transactionReference: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  providerTransactionId: {
    type: String,
    trim: true,
  },
  paymentInstructions: {
    type: String,
    trim: true,
  },
  failureReason: {
    type: String,
    trim: true,
  },
  confirmedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setMinutes(date.getMinutes() + 30);
      return date;
    },
  },
}, {
  timestamps: true,
});

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ transactionReference: 1 });
paymentSchema.index({ status: 1, expiresAt: 1 });

paymentSchema.statics.generateTransactionReference = function() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ZT-MM-${year}${month}${day}${hours}${minutes}${seconds}-${random}`;
};

paymentSchema.statics.getProviderDisplayName = function(provider) {
  const names = {
    mpesa: 'M-Pesa (Vodacom)',
    orange_money: 'Orange Money',
    airtel_money: 'Airtel Money',
    africell_money: 'Africell Money',
  };
  return names[provider] || provider;
};

paymentSchema.statics.getProviderInstructions = function(provider, phoneNumber, amount, transactionReference) {
  const instructions = {
    mpesa: `Pour payer via M-Pesa :\n1. Composez *151*1*1# sur votre téléphone Vodacom\n2. Sélectionnez "Payer une facture"\n3. Entrez le numéro marchand : 123456\n4. Entrez le montant : ${amount} USD\n5. Entrez la référence : ${transactionReference}\n6. Confirmez avec votre code PIN M-Pesa`,
    orange_money: `Pour payer via Orange Money :\n1. Composez #144# sur votre téléphone Orange\n2. Sélectionnez "Payer une facture"\n3. Entrez le numéro marchand : 0899000001\n4. Entrez le montant : ${amount} USD\n5. Entrez la référence : ${transactionReference}\n6. Confirmez avec votre code PIN Orange Money`,
    airtel_money: `Pour payer via Airtel Money :\n1. Composez *501# sur votre téléphone Airtel\n2. Sélectionnez "Payer"\n3. Entrez le numéro marchand : 0997000001\n4. Entrez le montant : ${amount} USD\n5. Entrez la référence : ${transactionReference}\n6. Confirmez avec votre code PIN Airtel Money`,
    africell_money: `Pour payer via Africell Money :\n1. Composez *111# sur votre téléphone Africell\n2. Sélectionnez "Paiement"\n3. Entrez le numéro marchand : 0901000001\n4. Entrez le montant : ${amount} USD\n5. Entrez la référence : ${transactionReference}\n6. Confirmez avec votre code PIN Africell Money`,
  };
  return instructions[provider] || '';
};

module.exports = mongoose.model('Payment', paymentSchema);
