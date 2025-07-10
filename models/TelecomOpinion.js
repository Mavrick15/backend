const mongoose = require('mongoose');

const TELECOM_OPINION_MESSAGES = {
  NAME_REQUIRED: 'Le nom est requis',
  EMAIL_REQUIRED: 'L\'email est requis',
  EMAIL_INVALID: 'Veuillez entrer une adresse email valide',
  SUBJECT_REQUIRED: 'Le sujet est requis',
  MESSAGE_REQUIRED: 'Le message est requis',
};

const telecomOpinionSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, TELECOM_OPINION_MESSAGES.NAME_REQUIRED],
    trim: true
  },
  email: {
    type: String,
    required: [true, TELECOM_OPINION_MESSAGES.EMAIL_REQUIRED],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, TELECOM_OPINION_MESSAGES.EMAIL_INVALID]
  },
  subject: {
    type: String,
    required: [true, TELECOM_OPINION_MESSAGES.SUBJECT_REQUIRED],
    trim: true
  },
  message: {
    type: String,
    required: [true, TELECOM_OPINION_MESSAGES.MESSAGE_REQUIRED],
    trim: true
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TelecomOpinion', telecomOpinionSchema);
