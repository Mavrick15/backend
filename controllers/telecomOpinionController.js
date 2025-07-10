const TelecomOpinion = require('../models/TelecomOpinion');
const { logger } = require('../log/logger');
const { sendAdminNotificationEmail, sendClientConfirmationEmail } = require('./emailService');

const MESSAGES = {
  EMAIL_ALREADY_USED: 'Un avis a déjà été soumis avec cet email. Veuillez utiliser un autre email ou nous contacter si vous avez besoin de modifier votre avis précédent.',
  OPINION_SAVED_SUCCESS: 'Votre avis a été enregistré avec succès.',
};

const LOG_MESSAGES = {
  WARN_EMAIL_ALREADY_USED: (email) => `Tentative de soumission d'avis avec un email déjà utilisé: ${email}`,
  INFO_NEW_OPINION_SAVED: 'Nouvelle opinion enregistrée:',
  ERROR_SAVING_OR_SENDING_EMAIL: 'Erreur lors de l\'enregistrement de l\'opinion ou de l\'envoi d\'e-mail:',
};

const createTelecomOpinion = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const existingOpinion = await TelecomOpinion.findOne({ email });

    if (existingOpinion) {
      logger.warn(LOG_MESSAGES.WARN_EMAIL_ALREADY_USED(email));
      return res.status(409).json({
        success: false,
        message: MESSAGES.EMAIL_ALREADY_USED
      });
    }

    const opinion = await TelecomOpinion.create({
      name,
      email,
      subject,
      message
    });

    logger.info(LOG_MESSAGES.INFO_NEW_OPINION_SAVED, opinion);

    sendAdminNotificationEmail({ name, email, subject, message });
    sendClientConfirmationEmail({ name, email, subject });

    res.status(201).json({ success: true, data: opinion, message: MESSAGES.OPINION_SAVED_SUCCESS });

  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_SAVING_OR_SENDING_EMAIL, error.message, error.stack);
    next(error);
  }
};

module.exports = {
  createTelecomOpinion
};
