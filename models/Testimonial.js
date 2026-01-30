const mongoose = require('mongoose');

const TESTIMONIAL_MESSAGES = {
  REQUIRED: (field) => `Le ${field} est requis`,
  RATING_INVALID: 'La note doit être entre 1 et 5',
};

const testimonialSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, TESTIMONIAL_MESSAGES.REQUIRED('nom du client')],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
  },
  clientRole: {
    type: String,
    trim: true,
  },
  clientCompany: {
    type: String,
    trim: true,
  },
  clientAvatar: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: [true, TESTIMONIAL_MESSAGES.REQUIRED('contenu du témoignage')],
    trim: true,
    minlength: [10, 'Le témoignage doit contenir au moins 10 caractères'],
  },
  rating: {
    type: Number,
    required: [true, TESTIMONIAL_MESSAGES.REQUIRED('note')],
    min: [1, TESTIMONIAL_MESSAGES.RATING_INVALID],
    max: [5, TESTIMONIAL_MESSAGES.RATING_INVALID],
  },
  service: {
    type: String,
    trim: true,
    enum: ['formation', 'service', 'support', 'projet', 'autre'],
    default: 'service',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  formationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
  },
}, {
  timestamps: true,
});

// Index pour améliorer les performances
testimonialSchema.index({ isApproved: 1, isFeatured: 1 });
testimonialSchema.index({ rating: -1 });
testimonialSchema.index({ createdAt: -1 });
testimonialSchema.index({ service: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
