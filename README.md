# Backend API - Zetoun Labs

API REST construite avec Express.js et MongoDB.

## 🚀 Démarrage rapide

```bash
# Installation des dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos configurations

# Développement
npm run dev

# Production
npm start
```

## 📋 Scripts disponibles

- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer le serveur en mode développement avec nodemon
- `npm test` - Exécuter les tests avec couverture
- `npm run test:watch` - Exécuter les tests en mode watch
- `npm run lint` - Vérifier le code avec ESLint
- `npm run lint:fix` - Corriger automatiquement les erreurs ESLint

## 🏗️ Structure du projet

```
backend/
├── config/          # Configuration (DB, validation env)
├── controllers/     # Contrôleurs pour les routes
├── log/            # Système de logging
├── middleware/      # Middlewares Express
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── healthCheck.js
│   ├── requestLogger.js
│   ├── sanitize.js
│   └── validation.js
├── models/          # Modèles Mongoose
├── routes/          # Routes Express
├── seeders/         # Seeders pour la base de données
├── tests/           # Tests unitaires et d'intégration
└── server.js        # Point d'entrée de l'application
```

## 🔐 Sécurité

- **Helmet** : Protection des en-têtes HTTP
- **CORS** : Configuration Cross-Origin
- **Rate Limiting** : Limitation des requêtes (100 req/15min)
- **JWT** : Authentification avec refresh tokens
- **Sanitization** : Nettoyage des entrées utilisateur
- **Validation** : Validation des données avec express-validator

## 📡 Endpoints

### Health Check
- `GET /health` - État complet de l'application
- `GET /ready` - Readiness check (Kubernetes)
- `GET /live` - Liveness check (Kubernetes)
- `GET /ping` - Simple ping

### Authentification
- `POST /api/auth/signup` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/profile` - Profil utilisateur (protégé)

### Formations
- `GET /api/formations` - Liste des formations
- `GET /api/formations/:id` - Détails d'une formation
- `POST /api/formations` - Créer une formation (protégé)

### Inscriptions
- `POST /api/enrollments` - S'inscrire à une formation (protégé)

### Avis Télécom
- `POST /api/telecom-opinions` - Soumettre un avis

## 🧪 Tests

```bash
# Tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Tests unitaires uniquement
npm run test:unit
```

Les tests nécessitent une base de données MongoDB de test. Configurez `TEST_MONGODB_URI` dans votre `.env`.

## 📝 Logging

Les logs sont écrits dans le dossier `logs/` avec le fichier `app.log`. Le système de logging enregistre :
- Toutes les requêtes HTTP
- Les erreurs
- Les warnings
- Les informations importantes

## 🔧 Configuration

Voir `.env.example` pour la liste complète des variables d'environnement requises.

## 📚 Documentation API

Pour plus de détails sur l'API, consultez le README principal du projet.
