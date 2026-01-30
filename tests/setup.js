/**
 * Configuration globale pour les tests Jest
 */

// Augmenter le timeout pour les tests de base de données
jest.setTimeout(30000);

// Variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/zetoun_test';

// Supprimer les warnings de console pendant les tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
