# Zetoun Labs

Projet Zetoun Labs : site vitrine et API (frontend + backend).

## Structure du projet

- **frontend/** – Application React (Vite, TypeScript), déployée sur Cloudflare Pages
- **backend/** – API REST Express.js + MongoDB, déployée sur Render
- **Base de données** – MongoDB Atlas

## Démarrage rapide

### Backend

```bash
cd backend
cp .env.example .env
# Éditer .env (MONGODB_URI, JWT_SECRET, etc.)
npm install
npm run dev
```

Voir [backend/README.md](backend/README.md) pour la configuration et les endpoints.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Tests

- **Backend** : `cd backend && npm test` (Jest). Couverture actuelle à étendre (voir `backend/tests/`).
- **Frontend** : `cd frontend && npm test` (Vitest).

## Licence

Voir [LICENSE](LICENSE).
