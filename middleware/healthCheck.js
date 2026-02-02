const mongoose = require('mongoose');
const { logger } = require('../log/logger');

const HTTP_OK = 200;
const HTTP_SERVICE_UNAVAILABLE = 503;

/**
 * Health check endpoint
 * Vérifie l'état de la base de données et du serveur
 */
const healthCheck = async (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: {
        status: 'unknown',
        responseTime: null,
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        unit: 'MB',
      },
    },
  };

  // Vérifier la connexion MongoDB
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    healthStatus.checks.database = {
      status: 'connected',
      responseTime: `${responseTime}ms`,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };

    logger.info('Health check: All systems operational', healthStatus);
    res.status(HTTP_OK).json(healthStatus);
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.checks.database = {
      status: 'disconnected',
      error: error.message,
    };

    logger.error('Health check: Database connection failed', { error: error.message });
    res.status(HTTP_SERVICE_UNAVAILABLE).json(healthStatus);
  }
};

/**
 * Readiness check - vérifie si l'application est prête à recevoir du trafic
 */
const readinessCheck = async (req, res) => {
  try {
    // Vérifier MongoDB
    await mongoose.connection.db.admin().ping();

    res.status(HTTP_OK).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(HTTP_SERVICE_UNAVAILABLE).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Liveness check - vérifie si l'application est en vie
 */
const livenessCheck = (req, res) => {
  res.status(HTTP_OK).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  healthCheck,
  readinessCheck,
  livenessCheck,
};
