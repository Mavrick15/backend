const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../log/logger');

const AUTH_MESSAGES = {
  UNAUTHORIZED_NO_TOKEN: 'Non autorisé, pas de token.',
  UNAUTHORIZED_INVALID_TOKEN: 'Non autorisé, token invalide.',
  UNAUTHORIZED_USER_NOT_FOUND: 'Non autorisé, utilisateur non trouvé.',
};

const LOG_MESSAGES = {
  WARN_NO_AUTH_TOKEN_ATTEMPT: 'Tentative d\'accès sans token d\'authentification.',
  ERROR_TOKEN_VERIFICATION: (errorMessage) => `Erreur de vérification du token: ${errorMessage}`,
  WARN_VALID_TOKEN_USER_NOT_FOUND: 'Token valide mais utilisateur non trouvé dans la base de données.',
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn(LOG_MESSAGES.WARN_NO_AUTH_TOKEN_ATTEMPT);
    return res.status(401).json({ message: AUTH_MESSAGES.UNAUTHORIZED_NO_TOKEN });
  }

  try {
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET non défini dans les variables d\'environnement');
      return res.status(500).json({ message: 'Erreur de configuration du serveur' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      logger.warn(LOG_MESSAGES.WARN_VALID_TOKEN_USER_NOT_FOUND);
      return res.status(401).json({ message: AUTH_MESSAGES.UNAUTHORIZED_USER_NOT_FOUND });
    }
    
    next();
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_TOKEN_VERIFICATION(error.message));
    return res.status(401).json({ message: AUTH_MESSAGES.UNAUTHORIZED_INVALID_TOKEN });
  }
};

module.exports = { protect };
