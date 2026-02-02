require("dotenv").config();
const { logger } = require("../log/logger");

const ENV_VARIABLES = {
  REQUIRED: [
    "MONGODB_URI",
    "JWT_SECRET",
    "FRONTEND_URL",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_FROM",
    "ADMIN_EMAIL",
  ],
  OPTIONAL: {
    PORT: "5010",
    NODE_ENV: "development",
    EMAIL_SECURE: "false",
    JWT_REFRESH_SECRET: null, // Will be generated if not provided
    JWT_EXPIRE: "30d",
    JWT_REFRESH_EXPIRE: "90d",
  },
};

const ENV_MESSAGES = {
  MISSING_VARIABLE: (varName) =>
    `❌ ERREUR : La variable d'environnement ${varName} est requise mais n'est pas définie.`,
  VALIDATION_SUCCESS:
    "✅ Toutes les variables d'environnement requises sont définies.",
  VALIDATION_START: "Vérification des variables d'environnement...",
};

function validateEnvVariables() {
  logger.info(ENV_MESSAGES.VALIDATION_START);

  const missingVariables = [];

  ENV_VARIABLES.REQUIRED.forEach((varName) => {
    if (!process.env[varName]) {
      missingVariables.push(varName);
      logger.error(ENV_MESSAGES.MISSING_VARIABLE(varName));
    }
  });

  if (missingVariables.length > 0) {
    logger.error(
      `${missingVariables.length} variable(s) d'environnement manquante(s).`,
    );
    logger.error(
      "Veuillez créer un fichier .env avec toutes les variables requises.",
    );
    process.exit(1);
  }

  // Set optional variables with defaults
  Object.entries(ENV_VARIABLES.OPTIONAL).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });

  // Validate specific formats
  validateEmailFormat("EMAIL_FROM");
  validateEmailFormat("ADMIN_EMAIL");
  validateNumberFormat("EMAIL_PORT");
  validateBooleanFormat("EMAIL_SECURE");

  // Set JWT_REFRESH_SECRET if not provided (use JWT_SECRET as fallback)
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
    logger.warn(
      "JWT_REFRESH_SECRET non défini, utilisation de JWT_SECRET comme fallback.",
    );
  }

  logger.info(ENV_MESSAGES.VALIDATION_SUCCESS);
}

function validateEmailFormat(varName) {
  const value = process.env[varName];
  if (!value) return;
  // Accepte "email@domain" ou "Nom <email@domain>"
  const angleMatch = value.match(/<([^>]+)>/);
  const emailToCheck = angleMatch ? angleMatch[1].trim() : value.trim();
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;
  if (!emailRegex.test(emailToCheck)) {
    logger.warn(
      `${varName} ne semble pas être une adresse email valide: ${value}`,
    );
  }
}

function validateNumberFormat(varName) {
  const value = process.env[varName];
  if (value && isNaN(Number(value))) {
    logger.error(`${varName} doit être un nombre, valeur actuelle: ${value}`);
    process.exit(1);
  }
}

function validateBooleanFormat(varName) {
  const value = process.env[varName];
  if (value && value !== "true" && value !== "false") {
    logger.warn(
      `${varName} devrait être 'true' ou 'false', valeur actuelle: ${value}`,
    );
  }
}

module.exports = { validateEnvVariables };
