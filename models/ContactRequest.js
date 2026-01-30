const mongoose = require('mongoose');

const CONTACT_MESSAGES = {
  NAME_REQUIRED: 'Le nom est requis',
  EMAIL_REQUIRED: "L'email est requis",
  EMAIL_INVALID: "Veuillez entrer une adresse email valide",
  SUBJECT_REQUIRED: 'Le sujet est requis',
  MESSAGE_REQUIRED: 'Le message est requis',
};

const contactRequestSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, CONTACT_MESSAGES.NAME_REQUIRED],
      trim: true,
    },
    email: {
      type: String,
      required: [true, CONTACT_MESSAGES.EMAIL_REQUIRED],
      trim: true,
      lowercase: true,
      match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/, CONTACT_MESSAGES.EMAIL_INVALID],
    },
    subject: {
      type: String,
      required: [true, CONTACT_MESSAGES.SUBJECT_REQUIRED],
      trim: true,
    },
    message: {
      type: String,
      required: [true, CONTACT_MESSAGES.MESSAGE_REQUIRED],
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { timestamps: true }
);

contactRequestSchema.index({ email: 1, submittedAt: -1 });
contactRequestSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
