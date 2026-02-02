require("dotenv").config();
const mongoose = require("mongoose");
const { logger } = require("../log/logger");

const DB_MESSAGES = {
  MONGO_URI_UNDEFINED_ERROR:
    "La variable MONGODB_URI n'est pas définie dans votre fichier .env",
  MONGO_URI_HINT:
    "Veuillez vous assurer que votre fichier .env existe et contient MONGODB_URI=votre_chaine_de_connexion",
  ATTEMPTING_CONNECTION: "Tentative de connexion à MongoDB...",
  CONNECTION_SUCCESS: (host) => `MongoDB connecté avec succès : ${host}`,
  CONNECTION_ERROR: (message) => `Erreur de connexion MongoDB : ${message}`,
};

(function checkMongoURI() {
  if (!process.env.MONGODB_URI) {
    logger.error(DB_MESSAGES.MONGO_URI_UNDEFINED_ERROR);
    logger.error(DB_MESSAGES.MONGO_URI_HINT);
    process.exit(1);
  }
})();

const SERVER_SELECTION_TIMEOUT_MS = 5000;

const connectDB = async () => {
  try {
    logger.info(DB_MESSAGES.ATTEMPTING_CONNECTION);
    const options = {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info(DB_MESSAGES.CONNECTION_SUCCESS(conn.connection.host));
  } catch (error) {
    logger.error(DB_MESSAGES.CONNECTION_ERROR(error.message));
    process.exit(1);
  }
};

module.exports = connectDB;
