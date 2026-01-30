const mongoose = require('mongoose');

const STATISTIC_MESSAGES = {
  REQUIRED: (field) => `Le ${field} est requis`,
  VALUE_NEGATIVE: 'La valeur ne peut pas être négative',
};

const statisticSchema = new mongoose.Schema({
  label: {
    type: String,
    required: [true, STATISTIC_MESSAGES.REQUIRED('libellé')],
    trim: true,
    unique: true,
  },
  value: {
    type: Number,
    required: [true, STATISTIC_MESSAGES.REQUIRED('valeur')],
    min: [0, STATISTIC_MESSAGES.VALUE_NEGATIVE],
  },
  unit: {
    type: String,
    trim: true,
    default: '',
  },
  icon: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
    enum: ['clients', 'projets', 'formations', 'certifications', 'experience', 'autre'],
    default: 'autre',
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index pour améliorer les performances
// Note: label a déjà un index via unique: true, pas besoin de le redéfinir
statisticSchema.index({ isActive: 1, order: 1 });
statisticSchema.index({ category: 1 });

module.exports = mongoose.model('Statistic', statisticSchema);
