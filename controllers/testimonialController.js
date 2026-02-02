const Testimonial = require('../models/Testimonial');
const { logger } = require('../log/logger');
const mongoose = require('mongoose');

const MESSAGES = {
  TESTIMONIAL_CREATED: 'Témoignage créé avec succès',
  TESTIMONIAL_UPDATED: 'Témoignage mis à jour avec succès',
  TESTIMONIAL_DELETED: 'Témoignage supprimé avec succès',
  TESTIMONIAL_NOT_FOUND: 'Témoignage non trouvé',
  TESTIMONIALS_FETCHED: 'Témoignages récupérés avec succès',
  UNAUTHORIZED: 'Non autorisé',
};

const LOG_MESSAGES = {
  INFO_TESTIMONIAL_CREATED: (id) => `Témoignage créé: ${id}`,
  INFO_TESTIMONIAL_UPDATED: (id) => `Témoignage mis à jour: ${id}`,
  INFO_TESTIMONIAL_DELETED: (id) => `Témoignage supprimé: ${id}`,
  WARN_TESTIMONIAL_NOT_FOUND: (id) => `Témoignage non trouvé: ${id}`,
  ERROR_TESTIMONIAL_OPERATION: 'Erreur lors de l\'opération sur le témoignage:',
};

/**
 * Créer un témoignage
 */
const createTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.create(req.body);

    logger.info(LOG_MESSAGES.INFO_TESTIMONIAL_CREATED(testimonial._id));

    res.status(201).json({
      success: true,
      message: MESSAGES.TESTIMONIAL_CREATED,
      testimonial,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_TESTIMONIAL_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Récupérer tous les témoignages approuvés
 */
const getTestimonials = async (req, res, next) => {
  try {
    const { featured, service, limit = 10, offset = 0 } = req.query;
    
    const query = { isApproved: true };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (service) {
      query.service = service;
    }
    
    const testimonials = await Testimonial.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await Testimonial.countDocuments(query);
    
    res.status(200).json({
      success: true,
      message: MESSAGES.TESTIMONIALS_FETCHED,
      testimonials,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_TESTIMONIAL_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Récupérer un témoignage par ID
 */
const getTestimonialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      logger.warn(LOG_MESSAGES.WARN_TESTIMONIAL_NOT_FOUND(id));
      return res.status(404).json({ success: false, message: MESSAGES.TESTIMONIAL_NOT_FOUND });
    }
    
    res.status(200).json({
      success: true,
      testimonial,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_TESTIMONIAL_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Mettre à jour un témoignage
 */
const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    
    const testimonial = await Testimonial.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    
    if (!testimonial) {
      return res.status(404).json({ success: false, message: MESSAGES.TESTIMONIAL_NOT_FOUND });
    }
    
    logger.info(LOG_MESSAGES.INFO_TESTIMONIAL_UPDATED(id));
    
    res.status(200).json({
      success: true,
      message: MESSAGES.TESTIMONIAL_UPDATED,
      testimonial,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_TESTIMONIAL_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

/**
 * Supprimer un témoignage
 */
const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }
    
    const testimonial = await Testimonial.findByIdAndDelete(id);
    
    if (!testimonial) {
      return res.status(404).json({ success: false, message: MESSAGES.TESTIMONIAL_NOT_FOUND });
    }
    
    logger.info(LOG_MESSAGES.INFO_TESTIMONIAL_DELETED(id));
    
    res.status(200).json({
      success: true,
      message: MESSAGES.TESTIMONIAL_DELETED,
    });
  } catch (error) {
    logger.error(LOG_MESSAGES.ERROR_TESTIMONIAL_OPERATION, { message: error.message, stack: error.stack });
    next(error);
  }
};

module.exports = {
  createTestimonial,
  getTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
};
