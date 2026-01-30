const Statistic = require('../models/Statistic');
const { logger } = require('../log/logger');
const mongoose = require('mongoose');

const MESSAGES = {
  STATISTIC_CREATED: 'Statistique créée avec succès',
  STATISTIC_UPDATED: 'Statistique mise à jour avec succès',
  STATISTIC_DELETED: 'Statistique supprimée avec succès',
  STATISTIC_NOT_FOUND: 'Statistique non trouvée',
  STATISTICS_FETCHED: 'Statistiques récupérées avec succès',
};

const LOG_MESSAGES = {
  INFO_STATISTIC_CREATED: (id) => `Statistique créée: ${id}`,
  INFO_STATISTIC_UPDATED: (id) => `Statistique mise à jour: ${id}`,
  INFO_STATISTIC_DELETED: (id) => `Statistique supprimée: ${id}`,
  WARN_STATISTIC_NOT_FOUND: (id) => `Statistique non trouvée: ${id}`,
  ERROR_STATISTIC_OPERATION: 'Erreur lors de l\'opération sur la statistique:',
};

/**
 * Créer une statistique
 */
const createStatistic = async (req, res, next) => {
  try {
    const statistic = await Statistic.create(req.body);
    
    logger.info(LOG_MESSAGES.INFO_STATISTIC_CREATED(statistic._id));
    
    res.status(201).json({
      success: true,
      message: MESSAGES.STATISTIC_CREATED,
      statistic,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_STATISTIC_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Récupérer toutes les statistiques actives
 */
const getStatistics = async (req, res, next) => {
  try {
    const { category } = req.query;
    
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    const statistics = await Statistic.find(query)
      .sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: MESSAGES.STATISTICS_FETCHED,
      statistics,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_STATISTIC_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Récupérer une statistique par ID
 */
const getStatisticById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    
    const statistic = await Statistic.findById(id);
    
    if (!statistic) {
      logger.warn(LOG_MESSAGES.WARN_STATISTIC_NOT_FOUND(id));
      return res.status(404).json({ success: false, message: MESSAGES.STATISTIC_NOT_FOUND });
    }
    
    res.status(200).json({
      success: true,
      statistic,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_STATISTIC_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Mettre à jour une statistique
 */
const updateStatistic = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    
    const statistic = await Statistic.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!statistic) {
      return res.status(404).json({ success: false, message: MESSAGES.STATISTIC_NOT_FOUND });
    }
    
    logger.info(LOG_MESSAGES.INFO_STATISTIC_UPDATED(id));
    
    res.status(200).json({
      success: true,
      message: MESSAGES.STATISTIC_UPDATED,
      statistic,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_STATISTIC_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Supprimer une statistique
 */
const deleteStatistic = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    
    const statistic = await Statistic.findByIdAndDelete(id);
    
    if (!statistic) {
      return res.status(404).json({ success: false, message: MESSAGES.STATISTIC_NOT_FOUND });
    }
    
    logger.info(LOG_MESSAGES.INFO_STATISTIC_DELETED(id));
    
    res.status(200).json({
      success: true,
      message: MESSAGES.STATISTIC_DELETED,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_STATISTIC_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

module.exports = {
  createStatistic,
  getStatistics,
  getStatisticById,
  updateStatistic,
  deleteStatistic,
};
