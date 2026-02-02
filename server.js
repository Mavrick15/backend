const express = require("express");
const compression = require("compression");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");
const { logger } = require("./log/logger");
const errorHandler = require("./middleware/errorHandler");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { validateEnvVariables } = require("./config/envValidation");

dotenv.config();
validateEnvVariables();

const app = express();

const startServer = async () => {
  try {
    await connectDB();

    app.set("trust proxy", 1);

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
      }),
    );
    app.use(
      cors({
        origin: [
          process.env.FRONTEND_URL || "http://localhost:5173",
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:8080",
          "http://127.0.0.1:8080",
          "http://10.0.0.2:8080",
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      }),
    );
    app.use(compression());
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
    const RATE_LIMIT_MAX_REQUESTS = 100;
    const apiLimiter = rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
      message:
        "Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes.",
    });

    // Request logging middleware
    const requestLogger = require("./middleware/requestLogger");
    app.use(requestLogger);

    // Sanitization middleware
    const { sanitizeInput } = require("./middleware/sanitize");
    app.use(sanitizeInput);

    app.use("/api/", apiLimiter);

    // Health check routes (avant les autres routes)
    const {
      healthCheck,
      readinessCheck,
      livenessCheck,
    } = require("./middleware/healthCheck");
    app.get("/health", healthCheck);
    app.get("/ready", readinessCheck);
    app.get("/live", livenessCheck);

    app.use("/api/auth", require("./routes/authRoutes"));
    app.use("/api/formations", require("./routes/formationRoutes"));
    app.use("/api/telecom-opinions", require("./routes/telecomOpinionRoutes"));
    app.use("/api/contact-requests", require("./routes/contactRequestRoutes"));
    app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
    app.use("/api/invoices", require("./routes/invoiceRoutes"));
    app.use("/api/testimonials", require("./routes/testimonialRoutes"));
    app.use("/api/statistics", require("./routes/statisticRoutes"));
    app.use("/api/company", require("./routes/companyRoutes"));

    // Existing root route
    app.get("/", (req, res) => {
      logger.info("GET / - API is running...");
      res.json({
        message: "API is running...",
        version: "1.0.0",
        endpoints: {
          health: "/health",
          ready: "/ready",
          live: "/live",
          api: "/api",
        },
      });
    });

    app.get("/ping", (req, res) => {
      logger.info("GET /ping - Health check received.");
      res
        .status(200)
        .json({ status: "OK", timestamp: new Date().toISOString() });
    });

    app.use(errorHandler);

    const PORT = process.env.PORT || 5010;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM signal reçu: fermeture du serveur...");
      server.close(() => {
        logger.info("Serveur fermé.");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT signal reçu: fermeture du serveur...");
      server.close(() => {
        logger.info("Serveur fermé.");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Erreur critique au démarrage du serveur:", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startServer();
