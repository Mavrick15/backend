const mongoose = require('mongoose');

const FORMATION_MESSAGES = {
  REQUIRED: (field) => `Le ${field} est requis`,
  PRICE_NEGATIVE: 'Le prix ne peut pas être négatif',
  SEATS_NEGATIVE: 'Le nombre de places ne peut pas être négatif',
  INVALID_LEVEL: 'Le niveau de la formation est invalide',
};

const FORMATION_LEVELS = ['Débutant', 'Intermédiaire', 'Avancé'];

const formationSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, FORMATION_MESSAGES.REQUIRED('titre de la formation')],
    trim: true
  },
  description: {
    type: String,
    required: [true, FORMATION_MESSAGES.REQUIRED('description de la formation')],
    trim: true
  },
  date: {
    type: String,
    required: [true, FORMATION_MESSAGES.REQUIRED('date de la formation')]
  },
  location: {
    type: String,
    required: [true, FORMATION_MESSAGES.REQUIRED('lieu de la formation')],
    trim: true
  },
  duration: {
    type: String,
    required: [true, FORMATION_MESSAGES.REQUIRED('durée de la formation')],
    trim: true
  },
  instructor: {
    type: String,
    required: [true, FORMATION_MESSAGES.REQUIRED('nom du formateur')],
    trim: true
  },
  price: {
    type: Number,
    required: [true, FORMATION_MESSAGES.REQUIRED('prix de la formation')],
    min: [0, FORMATION_MESSAGES.PRICE_NEGATIVE]
  },
  seats: {
    type: Number,
    required: [true, FORMATION_MESSAGES.REQUIRED('nombre de places disponibles')],
    min: [0, FORMATION_MESSAGES.SEATS_NEGATIVE]
  },
  level: {
    type: String,
    enum: {
      values: FORMATION_LEVELS,
      message: FORMATION_MESSAGES.INVALID_LEVEL
    },
    required: [true, FORMATION_MESSAGES.REQUIRED('niveau de la formation')],
    trim: true
  },
  image: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Formation', formationSchema);
