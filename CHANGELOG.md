# Changelog

Toutes les modifications notables du projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [Non publié]

### Backend

- Réponse immédiate à la création de facture, envoi d’email de confirmation en arrière-plan
- Compression gzip sur les réponses API
- Remplacement des `console.*` par le logger ; logs console uniquement en développement
- Constantes nommées pour nombres magiques (rate limit, timeouts, ports, etc.)
- Refactor de `createInvoice` : extraction de `createEnrollmentsForInvoice` et `scheduleInvoiceConfirmationEmail`
- Tableaux de validation renommés (noms pluriels) dans `middleware/validation.js`
- Versions des dépendances figées dans `package.json` (sans `^`)

### Frontend

- Optimisations latence : configuration React Query (staleTime, gcTime), skeletons (Statistics, Testimonials)
- Configuration Wrangler pour déploiement Cloudflare Pages

### Projet

- Ajout de README.md à la racine
- Ajout de LICENSE (MIT)
- Ajout de CHANGELOG.md

---

## [1.0.0] – 2024

- Version initiale (backend API, frontend React).
