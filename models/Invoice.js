const mongoose = require('mongoose');

const INVOICE_MESSAGES = {
  REQUIRED: 'Champ requis',
  INVALID_EMAIL: 'Veuillez entrer une adresse email valide',
  INVALID_PHONE: 'Veuillez entrer un numéro de téléphone valide',
  MIN_VALUE: 'La valeur doit être positive',
  INVALID_STATUS: 'Statut de facture invalide',
};

const INVOICE_STATUS = ['pending', 'paid', 'cancelled', 'refunded'];

const invoiceItemSchema = new mongoose.Schema({
  formationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: {
      values: INVOICE_STATUS,
      message: INVOICE_MESSAGES.INVALID_STATUS,
    },
    default: 'pending',
    index: true,
  },
  items: {
    type: [invoiceItemSchema],
    required: true,
    validate: {
      validator: (items) => items.length > 0,
      message: 'La facture doit contenir au moins un article',
    },
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  // Informations client
  clientInfo: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, INVOICE_MESSAGES.INVALID_EMAIL],
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
  },
  // Informations de paiement
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'mobile_money', 'card', 'other'],
    default: 'other',
  },
  paymentDate: {
    type: Date,
  },
  paymentReference: {
    type: String,
    trim: true,
  },
  // Métadonnées
  notes: {
    type: String,
    trim: true,
  },
  dueDate: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setDate(date.getDate() + 30); // 30 jours par défaut
      return date;
    },
  },
  paidAt: {
    type: Date,
  },
  cancelledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index pour améliorer les performances
// Note: invoiceNumber a déjà un index via unique: true, pas besoin de le redéfinir
invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, createdAt: -1 });

// Méthode pour générer un numéro de facture unique
invoiceSchema.statics.generateInvoiceNumber = function() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ZT${year}${month}${day}${hours}${minutes}${seconds}${random}`;
};

// Méthode pour calculer le total
invoiceSchema.methods.calculateTotal = function() {
  const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.subtotal = subtotal;
  this.total = subtotal + this.tax - this.discount;
  return this.total;
};

// Pré-save hook pour calculer le total
invoiceSchema.pre('save', function(next) {
  if (this.isModified('items') || this.isModified('tax') || this.isModified('discount')) {
    this.calculateTotal();
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
