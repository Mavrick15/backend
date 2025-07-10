const Formation = require('../models/Formation');
const { logger } = require('../log/logger');
const mongoose = require('mongoose');

const MESSAGES = {
  INVALID_FORMATION_ID: 'ID de formation invalide.',
  FORMATION_NOT_FOUND: 'Formation non trouvée',
};

const LOG_MESSAGES = {
  RETRIEVING_ALL_FORMATIONS: 'Récupération de toutes les formations',
  ERROR_RETRIEVING_FORMATIONS: 'Erreur lors de la récupération des formations:',
  WARN_INVALID_FORMATION_ID: 'ID de formation invalide fourni.',
  INFO_RETRIEVING_FORMATION_BY_ID: 'Récupération de la formation.',
  WARN_FORMATION_NOT_FOUND_BY_ID: 'Formation non trouvée.',
  ERROR_RETRIEVING_FORMATION_BY_ID: 'Erreur lors de la récupération de la formation:',
  INFO_NEW_FORMATION_CREATED: 'Nouvelle formation créée:',
  ERROR_CREATING_FORMATION: 'Erreur lors de la création de la formation:',
};

const getFormations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const filters = {};
    if (req.query.level) filters.level = req.query.level;
    if (req.query.location) filters.location = { $regex: req.query.location, $options: 'i' };
    if (req.query.search) {
      filters.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const formations = await Formation.find(filters)
      .sort({ date: 1 })
      .limit(limit)
      .skip(offset);

    const total = await Formation.countDocuments(filters);

    logger.info(LOG_MESSAGES.RETRIEVING_ALL_FORMATIONS, { filters, pagination: { limit, offset } });

    res.json({
      formations,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_RETRIEVING_FORMATIONS, error.message);
    next(error);
  }
};

const getFormationById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn(LOG_MESSAGES.WARN_INVALID_FORMATION_ID, { formationId: req.params.id });
      return res.status(400).json({ message: MESSAGES.INVALID_FORMATION_ID });
    }

    const formation = await Formation.findById(req.params.id);

    if (formation) {
      logger.info(LOG_MESSAGES.INFO_RETRIEVING_FORMATION_BY_ID, { formationId: req.params.id, formationTitle: formation.title });
      res.json(formation);
    } else {
      logger.warn(LOG_MESSAGES.WARN_FORMATION_NOT_FOUND_BY_ID, { formationId: req.params.id });
      res.status(404).json({ message: MESSAGES.FORMATION_NOT_FOUND });
    }
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_RETRIEVING_FORMATION_BY_ID, error.message, { formationId: req.params.id });
    next(error);
  }
};

const createFormation = async (req, res, next) => {
  try {
    const formation = await Formation.create(req.body);
    logger.info(LOG_MESSAGES.INFO_NEW_FORMATION_CREATED, { formationId: formation._id, formationTitle: formation.title });
    res.status(201).json(formation);
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_CREATING_FORMATION, error.message);
    next(error);
  }
};

module.exports = {
  getFormations,
  getFormationById,
  createFormation
};
