# Messages renvoyés par le backend

Ce document liste tous les messages que l’API peut renvoyer au frontend (succès, erreurs, validation), ainsi que le format des réponses.

---

## Format des réponses

- **Succès** : souvent `{ success: true, message: "...", data?: ... }` ou `{ message: "..." }`.
- **Erreur métier** : `{ success: false, message: "..." }` ou `{ message: "..." }`.
- **Validation (express-validator)** : `{ errors: [ { msg: string, path: string, ... } ] }` (status 400).
- **Erreur globale (errorHandler)** : `{ message: string, stack?: string }`.

Le frontend doit toujours lire `response.json()` puis :
- afficher `data.message` si présent ;
- sinon pour les 400 de validation, afficher `data.errors` (liste d’objets avec `msg`).

---

## 1. Authentification (`/api/auth`)

### Inscription (POST `/api/auth/signup`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 201 | `{ message }` | `"Utilisateur créé avec succès"` |
| 400 | `{ errors: [...] }` | Erreurs de validation (champs requis, email invalide, mot de passe trop court, etc.) |
| 400 | `{ message }` | `"Un utilisateur avec cet email existe déjà"` |

### Connexion (POST `/api/auth/login`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 200 | `{ message, token, refreshToken, user }` | `"Connexion réussie"` |
| 400 | `{ errors: [...] }` | Erreurs de validation |
| 401 | `{ message }` | `"Email ou mot de passe incorrect"` |

### Rafraîchir le token (POST `/api/auth/refresh`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 200 | `{ message, token, refreshToken }` | `"Token rafraîchi avec succès"` |
| 401 | `{ message }` | `"Token de rafraîchissement invalide ou expiré"` |

### Déconnexion (POST `/api/auth/logout`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 200 | `{ message }` | `"Déconnexion réussie"` |

### Profil (GET `/api/auth/profile`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 200 | `{ user }` | Pas de champ `message` |
| 401 | `{ message }` | `"Non autorisé: Informations utilisateur manquantes."` |

---

## 2. Middleware d’authentification (routes protégées)

Lorsqu’une route exige un token (Bearer) :

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 401 | `{ message }` | `"Non autorisé, pas de token."` |
| 401 | `{ message }` | `"Non autorisé, token invalide."` |
| 401 | `{ message }` | `"Non autorisé, utilisateur non trouvé."` |
| 500 | `{ message }` | `"Erreur de configuration du serveur"` (JWT_SECRET manquant) |

---

## 3. Factures (`/api/invoices`)

### Créer une facture (POST `/api/invoices`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 201 | `{ success, message, data }` | `"Facture créée avec succès."` |
| 400 | `{ success: false, errors: [...] }` | Erreurs de validation des champs |
| 401 | `{ success: false, message }` | `"Non autorisé : Token manquant."` ou `"Non autorisé : Token invalide."` |
| 404 | `{ success: false, message }` | `"Utilisateur non trouvé."` |
| 400 | `{ success: false, message }` | `"La facture doit contenir au moins un article."` |
| 404 | `{ success: false, message }` | `"Formation non trouvée: <ids>"` |

### Liste / détail / mise à jour facture

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 200 | `{ message, data }` | `"Factures récupérées avec succès."` / `"Facture mise à jour avec succès."` |
| 400 | `{ success: false, message }` | `"ID de facture invalide"` |
| 403 | `{ success: false, message }` | `"Non autorisé à accéder à cette facture."` |
| 404 | `{ success: false, message }` | `"Facture non trouvée."` |

---

## 4. Inscriptions aux formations (`/api/enrollments`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 201 | `{ message, enrollment }` | `"Vous avez été enrôlé à la formation \"<titre>\"."` |
| 400 | `{ message }` | `"L'ID de la formation est requis."` / `"L'ID de la formation est invalide."` |
| 400 | `{ message }` | `"Vous êtes déjà inscrit à cette formation."` |
| 400 | `{ message }` | `"Plus de places disponibles pour cette formation."` |
| 401 | `{ message }` | `"Non autorisé : Token manquant."` / `"Non autorisé : Token invalide. Détail: ..."` / `"Non autorisé : ID utilisateur manquant dans le token."` |
| 404 | `{ message }` | `"Utilisateur non trouvé."` / `"Formation non trouvée."` |

---

## 5. Formations (`/api/formations`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 400 | `{ message }` | `"ID de formation invalide."` |
| 404 | `{ message }` | `"Formation non trouvée"` |

(Liste et détail renvoient les données sans message particulier en cas de succès.)

---

## 6. Contact / Demande de contact (`/api/contact-requests`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 201 | `{ success, data, message }` | `"Votre message a été enregistré avec succès. Nous vous recontacterons rapidement."` |
| 400 | `{ errors: [...] }` | Erreurs de validation (nom, email, sujet, message requis / email invalide) |

---

## 7. Avis télécom (`/api/telecom-opinions`)

| Code | Corps de la réponse | Message |
|------|---------------------|--------|
| 201 | `{ success, data, message }` | `"Votre avis a été enregistré avec succès."` |
| 400 | `{ errors: [...] }` | Erreurs de validation |
| 409 | `{ success: false, message }` | `"Un avis a déjà été soumis avec cet email. Veuillez utiliser un autre email ou nous contacter si vous avez besoin de modifier votre avis précédent."` |

---

## 8. Autres routes (Company, Statistics, Testimonials)

- **Company** : 200 avec `message` du type "Entreprise récupérée / mise à jour", 403 `"Non autorisé"`.
- **Statistics** : 200/201 avec messages du type "Statistique créée / récupérée / mise à jour / supprimée", 400 `"ID invalide"`, 404 `"Statistique non trouvée"`.
- **Testimonials** : même logique (créée, récupérée, mise à jour, supprimée, ID invalide, non trouvée).

---

## 9. Erreur globale (middleware errorHandler)

Toute erreur non gérée par un contrôleur est renvoyée ainsi :

| Cas | Code | Corps | Message type |
|-----|------|--------|---------------|
| CastError (ID invalide) | 404 | `{ message }` | `"Ressource non trouvée. ID invalide: <value>"` |
| ValidationError (Mongoose) | 400 | `{ message }` | `"Erreurs de validation: <liste des messages>"` |
| Duplicata (code 11000) | 400 | `{ message }` | `"Duplicata de champ. La valeur <key> doit être unique."` |
| Autre | 500 | `{ message, stack? }` | `err.message` |

---

## 10. Rate limiting (toutes les routes `/api/*`)

| Code | Corps | Message |
|------|--------|--------|
| 429 | `{ message }` | `"Trop de requêtes depuis cette IP, veuillez réessayer après 15 minutes."` |

---

## Gestion côté frontend (résumé)

1. **Lire `data = await response.json()`** après chaque appel API.
2. **Afficher l’erreur** :
   - Si `data.message` existe → afficher `data.message` (toast, alerte, sous le formulaire).
   - Si `data.errors` existe (tableau) → afficher par exemple `data.errors.map(e => e.msg).join(', ')` ou une liste.
3. **Validation (400)** : les routes avec express-validator renvoient `{ errors: errors.array() }` ; chaque élément a au minimum `msg` et souvent `path` (nom du champ).
4. **Réseau** : en cas de `fetch` failed (pas de réponse JSON), afficher un message générique (« Impossible de joindre le serveur », « Erreur réseau »).
