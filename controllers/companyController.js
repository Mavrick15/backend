const Company = require('../models/Company');
const { logger } = require('../log/logger');

const MESSAGES = {
  COMPANY_FETCHED: 'Informations de l\'entreprise récupérées avec succès',
  COMPANY_UPDATED: 'Informations de l\'entreprise mises à jour avec succès',
  UNAUTHORIZED: 'Non autorisé - Seuls les administrateurs peuvent modifier les informations',
};

const LOG_MESSAGES = {
  INFO_COMPANY_FETCHED: 'Informations entreprise récupérées',
  INFO_COMPANY_UPDATED: 'Informations entreprise mises à jour',
  ERROR_COMPANY_OPERATION: 'Erreur lors de l\'opération sur l\'entreprise:',
};

/**
 * Récupérer les informations de l'entreprise
 */
const getCompany = async (req, res, next) => {
  try {
    const company = await Company.getCompany();

    logger.info(LOG_MESSAGES.INFO_COMPANY_FETCHED);

    res.status(200).json({
      success: true,
      message: MESSAGES.COMPANY_FETCHED,
      company,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_COMPANY_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Mettre à jour les informations de l'entreprise (admin seulement)
 */
const updateCompany = async (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: MESSAGES.UNAUTHORIZED });
    }

    let company = await Company.findOne();

    if (!company) {
      company = await Company.create(req.body);
    } else {
      company = await Company.findByIdAndUpdate(company._id, req.body, { new: true, runValidators: true });
    }

    logger.info(LOG_MESSAGES.INFO_COMPANY_UPDATED);

    res.status(200).json({
      success: true,
      message: MESSAGES.COMPANY_UPDATED,
      company,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_COMPANY_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

module.exports = {
  getCompany,
  updateCompany,
};
