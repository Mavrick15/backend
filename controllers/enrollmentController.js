const Formation = require('../models/Formation');
const Enrollment = require('../models/Enrollment');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../log/logger');
const mongoose = require('mongoose');

const MESSAGES = {
  TOKEN_MISSING: 'Non autorisé : Token manquant.',
  TOKEN_INVALID: 'Non autorisé : Token invalide. Détail:',
  USER_ID_MISSING: 'Non autorisé : ID utilisateur manquant dans le token.',
  FORMATION_ID_REQUIRED: 'L\'ID de la formation est requis.',
  FORMATION_ID_INVALID: 'L\'ID de la formation est invalide.',
  USER_NOT_FOUND: 'Utilisateur non trouvé.',
  ALREADY_ENROLLED: 'Vous êtes déjà inscrit à cette formation.',
  FORMATION_NOT_FOUND: 'Formation non trouvée.',
  NO_SEATS_AVAILABLE: 'Plus de places disponibles pour cette formation.',
  ENROLLMENT_SUCCESS: (title) => `Vous avez été enrôlé à la formation "${title}".`,
  UNEXPECTED_ERROR: 'Erreur inattendue lors de l\'enrôlement:'
};

const LOG_MESSAGES = {
  WARN_NO_TOKEN: 'Tentative d\'enrôlement sans token d\'authentification.',
  ERROR_TOKEN_VERIFICATION: 'Erreur de vérification du token:',
  ERROR_USER_ID_MISSING: 'ID utilisateur manquant après décodage du token.',
  WARN_FORMATION_ID_MISSING: 'ID de formation manquant dans la requête.',
  WARN_FORMATION_ID_INVALID: 'ID de formation invalide:',
  WARN_USER_NOT_FOUND: () => `Utilisateur non trouvé dans la base de données. Enrôlement annulé.`,
  INFO_ATTEMPT_ENROLL: (userName, formationTitle) => `Tentative d'enrôlement de l'utilisateur "${userName}" à la formation "${formationTitle}".`,
  WARN_ALREADY_ENROLLED: (userName, formationTitle) => `Utilisateur "${userName}" déjà inscrit à la formation "${formationTitle}".`,
  WARN_FORMATION_NOT_FOUND_UPDATE: (userName) => `Formation non trouvée lors de la tentative de mise à jour pour l'utilisateur "${userName}".`,
  WARN_NO_SEATS_AVAILABLE: (formationTitle, userName) => `Plus de places disponibles pour la formation "${formationTitle}". L'utilisateur "${userName}" n'a pas pu s'inscrire.`,
  INFO_SEAT_DECREMENTED: (formationTitle, newSeats) => `Nombre de places décrémenté avec succès pour la formation "${formationTitle}". Nouvelles places: ${newSeats}.`,
  INFO_ENROLLMENT_SUCCESS: (userName, formationTitle) => `Utilisateur "${userName}" inscrit avec succès à la formation "${formationTitle}".`,
  ERROR_UNEXPECTED: 'Erreur inattendue lors de l\'enrôlement:'
};

const enrollUserToFormation = async (req, res, next) => {
  try {
    const { formationId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn(LOG_MESSAGES.WARN_NO_TOKEN);
      return res.status(401).json({ message: MESSAGES.TOKEN_MISSING });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error(`${LOG_MESSAGES.ERROR_TOKEN_VERIFICATION} ${error.message}`, { error: error.message });
      return res.status(401).json({ message: `${MESSAGES.TOKEN_INVALID} ${error.message}` });
    }

    const userId = decodedToken.id;

    if (!userId) {
      logger.error(LOG_MESSAGES.ERROR_USER_ID_MISSING);
      return res.status(401).json({ message: MESSAGES.USER_ID_MISSING });
    }

    if (!formationId) {
      logger.warn(LOG_MESSAGES.WARN_FORMATION_ID_MISSING);
      return res.status(400).json({ message: MESSAGES.FORMATION_ID_REQUIRED });
    }

    if (!mongoose.Types.ObjectId.isValid(formationId)) {
      logger.warn(`${LOG_MESSAGES.WARN_FORMATION_ID_INVALID} ${formationId}`, { formationId });
      return res.status(400).json({ message: MESSAGES.FORMATION_ID_INVALID });
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(LOG_MESSAGES.WARN_USER_NOT_FOUND(), { userId });
      return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    const formationDetails = await Formation.findById(formationId);
    if (!formationDetails) {
      logger.warn(LOG_MESSAGES.WARN_FORMATION_NOT_FOUND_UPDATE(user.name), { formationId, userName: user.name });
      return res.status(404).json({ message: MESSAGES.FORMATION_NOT_FOUND });
    }

    logger.info(LOG_MESSAGES.INFO_ATTEMPT_ENROLL(user.name, formationDetails.title), { userName: user.name, userId, formationId, formationTitle: formationDetails.title });

    const existingEnrollment = await Enrollment.findOne({ user: userId, formation: formationId });
    if (existingEnrollment) {
      logger.warn(LOG_MESSAGES.WARN_ALREADY_ENROLLED(user.name, formationDetails.title), { userName: user.name, userId, formationId, formationTitle: formationDetails.title });
      return res.status(400).json({ message: MESSAGES.ALREADY_ENROLLED });
    }

    const updatedFormation = await Formation.findOneAndUpdate(
      { _id: formationId, seats: { $gt: 0 } },
      { $inc: { seats: -1 } },
      { new: true }
    );

    if (!updatedFormation) {
      const formationCheck = await Formation.findById(formationId);
      if (!formationCheck) {
        logger.warn(LOG_MESSAGES.WARN_FORMATION_NOT_FOUND_UPDATE(user.name), { formationId, userName: user.name });
        return res.status(404).json({ message: MESSAGES.FORMATION_NOT_FOUND });
      } else {
        logger.warn(LOG_MESSAGES.WARN_NO_SEATS_AVAILABLE(formationCheck.title, user.name), { formationId, formationTitle: formationCheck.title, userName: user.name });
        return res.status(400).json({ message: MESSAGES.NO_SEATS_AVAILABLE });
      }
    }

    logger.info(LOG_MESSAGES.INFO_SEAT_DECREMENTED(updatedFormation.title, updatedFormation.seats), { formationId: updatedFormation._id, formationTitle: updatedFormation.title, newSeats: updatedFormation.seats });

    const enrollment = await Enrollment.create({
      user: userId,
      userName: user.name,
      userEmail: user.email,
      formation: updatedFormation._id,
      formationTitle: updatedFormation.title,
      formationDate: updatedFormation.date,
      formationLocation: updatedFormation.location,
      formationDuration: updatedFormation.duration,
      formationInstructor: updatedFormation.instructor,
      formationPrice: updatedFormation.price,
      formationSeats: updatedFormation.seats + 1,
      formationLevel: updatedFormation.level
    });

    logger.info(LOG_MESSAGES.INFO_ENROLLMENT_SUCCESS(user.name, updatedFormation.title), { userName: user.name, userId, formationId: updatedFormation._id, formationTitle: updatedFormation.title, enrollmentId: enrollment._id });

    res.status(201).json({ message: MESSAGES.ENROLLMENT_SUCCESS(updatedFormation.title), enrollment });

  } catch (error) {
    logger.error(`${LOG_MESSAGES.ERROR_UNEXPECTED} ${error.message}`, { errorStack: error.stack });
    next(error);
  }
};

module.exports = {
  enrollUserToFormation
};
