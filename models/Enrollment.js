const mongoose = require('mongoose');

const VALIDATION_MESSAGES = {
  REQUIRED: 'Champ requis',
  INVALID_EMAIL: 'Veuillez entrer une adresse email valide',
  MIN_VALUE: 'La valeur doit être positive',
  INVALID_ENUM: 'Valeur invalide',
};

const ENUM_VALUES = {
  LEVELS: ['Débutant', 'Intermédiaire', 'Avancé'],
};

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    immutable: true
  },
  userName: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    trim: true
  },
  userEmail: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, VALIDATION_MESSAGES.INVALID_EMAIL]
  },
  formation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Formation',
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    immutable: true
  },
  formationTitle: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    trim: true
  },
  formationDate: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED]
  },
  formationLocation: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    trim: true
  },
  formationDuration: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    trim: true
  },
  formationInstructor: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    trim: true
  },
  formationPrice: {
    type: Number,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    min: [0, VALIDATION_MESSAGES.MIN_VALUE]
  },
  formationSeats: {
    type: Number,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    min: [0, VALIDATION_MESSAGES.MIN_VALUE]
  },
  formationLevel: {
    type: String,
    required: [true, VALIDATION_MESSAGES.REQUIRED],
    enum: {
      values: ENUM_VALUES.LEVELS,
      message: VALIDATION_MESSAGES.INVALID_ENUM
    },
    trim: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: true
});

enrollmentSchema.index({ user: 1, formation: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);

