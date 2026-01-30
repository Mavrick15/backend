const ContactRequest = require('../models/ContactRequest');
const { logger } = require('../log/logger');
const { sendAdminNotificationEmail, sendClientConfirmationEmail } = require('./emailService');

const MESSAGES = {
  CONTACT_SAVED_SUCCESS: 'Votre message a été enregistré avec succès. Nous vous recontacterons rapidement.',
};

const LOG_MESSAGES = {
  INFO_NEW_CONTACT_SAVED: 'Nouvelle demande de contact enregistrée:',
  ERROR_SAVING_OR_SENDING_EMAIL: "Erreur lors de l'enregistrement de la demande ou de l'envoi d'e-mail:",
};

const createContactRequest = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    const contactRequest = await ContactRequest.create({
      name,
      email,
      subject,
      message,
    });

    logger.info(LOG_MESSAGES.INFO_NEW_CONTACT_SAVED, { id: contactRequest._id, email: contactRequest.email });

    sendAdminNotificationEmail({ name, email, subject, message }).catch((err) => {
      logger.warn("Envoi email admin (contact) échoué:", err.message);
    });
    sendClientConfirmationEmail({ name, email, subject }).catch((err) => {
      logger.warn("Envoi email confirmation client échoué:", err.message);
    });

    res.status(201).json({
      success: true,
      data: contactRequest,
      message: MESSAGES.CONTACT_SAVED_SUCCESS,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_SAVING_OR_SENDING_EMAIL, error.message, error.stack);
    next(error);
  }
};

module.exports = {
  createContactRequest,
};
