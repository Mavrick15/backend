const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const { logger } = require('./log/logger');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

const startServer = async () => {
  try {
    await connectDB();

    app.set('trust proxy', 1);

    app.use(helmet());
    app.use(cors({
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express.json());

    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes.'
    });

    app.use('/api/', apiLimiter);

    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/formations', require('./routes/formationRoutes'));
    app.use('/api/telecom-opinions', require('./routes/telecomOpinionRoutes'));
    app.use('/api/enrollments', require('./routes/enrollmentRoutes'));

    app.get('/', (req, res) => {
      logger.info('GET / - API is running...');
      res.send('API is running...');
    });

    app.use(errorHandler);

    const PORT = process.env.PORT || 5010;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`Server running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal reçu: fermeture du serveur...');
      server.close(() => {
        logger.info('Serveur fermé.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal reçu: fermeture du serveur...');
      server.close(() => {
        logger.info('Serveur fermé.');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Erreur critique au démarrage du serveur:', { message: error.message, stack: error.stack });
    console.error('Détails de l\'erreur critique:', error);
    process.exit(1);
  }
};

startServer();
