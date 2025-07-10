require('dotenv').config();
const mongoose = require('mongoose');

const DB_MESSAGES = {
  MONGO_URI_UNDEFINED_ERROR: '❌ ERREUR : La variable MONGODB_URI n\'est pas définie dans votre fichier .env !',
  MONGO_URI_HINT: 'Veuillez vous assurer que votre fichier .env existe et contient MONGODB_URI=votre_chaine_de_connexion',
  ATTEMPTING_CONNECTION: 'Tentative de connexion à MongoDB...',
  CONNECTION_SUCCESS: (host) => `✅ MongoDB connecté avec succès : ${host}`,
  CONNECTION_ERROR: (message) => `❌ Erreur de connexion MongoDB : ${message}`,
};

(function checkMongoURI() {
  if (!process.env.MONGODB_URI) {
    console.error(DB_MESSAGES.MONGO_URI_UNDEFINED_ERROR);
    console.error(DB_MESSAGES.MONGO_URI_HINT);
    process.exit(1);
  }
})();

console.log(DB_MESSAGES.ATTEMPTING_CONNECTION);

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(DB_MESSAGES.CONNECTION_SUCCESS(conn.connection.host));
  } catch (error) {
    console.error(DB_MESSAGES.CONNECTION_ERROR(error.message));
    process.exit(1);
  }
};

module.exports = connectDB;
