const mongoose = require('mongoose');

const USER_MESSAGES = {
  NAME_REQUIRED: 'Veuillez ajouter un nom',
  NAME_MIN_LENGTH: 'Le nom doit contenir au moins 2 caractères',
  EMAIL_REQUIRED: 'Veuillez ajouter un email',
  EMAIL_INVALID: 'Veuillez entrer une adresse email valide',
  PASSWORD_REQUIRED: 'Veuillez ajouter un mot de passe',
  PASSWORD_MIN_LENGTH: 'Le mot de passe doit contenir au moins 6 caractères',
  INVALID_ROLE: 'Le rôle doit être user ou admin', // Though not explicitly used in `enum` message, good for consistency
};

const USER_ROLES = ['user', 'admin'];

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, USER_MESSAGES.NAME_REQUIRED],
    trim: true,
    minlength: [2, USER_MESSAGES.NAME_MIN_LENGTH]
  },
  email: {
    type: String,
    required: [true, USER_MESSAGES.EMAIL_REQUIRED],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, USER_MESSAGES.EMAIL_INVALID]
  },
  password: {
    type: String,
    required: [true, USER_MESSAGES.PASSWORD_REQUIRED],
    minlength: [6, USER_MESSAGES.PASSWORD_MIN_LENGTH],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: USER_ROLES,
      message: USER_MESSAGES.INVALID_ROLE // Explicit message for enum validation
    },
    default: 'user'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
