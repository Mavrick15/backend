/**
 * Tests unitaires pour les routes d'authentification
 * 
 * Pour exécuter les tests:
 * npm install --save-dev jest supertest
 * npm test
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration de test
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/zetoun_test';

describe('Routes d\'authentification', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Connexion à la base de données de test
    await mongoose.connect(TEST_DB_URI);
    
    // Créer l'application Express
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('../routes/authRoutes'));
    
    server = app.listen(0); // Port aléatoire pour les tests
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('POST /api/auth/signup', () => {
    it('devrait créer un nouvel utilisateur avec des données valides', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('devrait rejeter un email déjà utilisé', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      // Créer le premier utilisateur
      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Tenter de créer un deuxième utilisateur avec le même email
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe déjà');
    });

    it('devrait rejeter des données invalides', async () => {
      const invalidData = {
        name: 'A', // Trop court
        email: 'invalid-email', // Email invalide
        password: '123', // Trop court
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Créer un utilisateur de test
      const User = require('../models/User');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      });
    });

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('devrait rejeter un email incorrect', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });

    it('devrait rejeter un mot de passe incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrect');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Créer un utilisateur et obtenir un refresh token
      const User = require('../models/User');
      const RefreshToken = require('../models/RefreshToken');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      const tokenDoc = await RefreshToken.create({
        token: 'test-refresh-token',
        user: user._id,
        expiresAt,
      });

      refreshToken = tokenDoc.token;
    });

    it('devrait rafraîchir un token valide', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('devrait rejeter un token invalide', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
