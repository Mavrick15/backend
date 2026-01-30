const mongoose = require('mongoose');

const refreshTokenSchema = mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // Auto-delete expired tokens
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index pour améliorer les performances
refreshTokenSchema.index({ user: 1, token: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
