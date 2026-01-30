/**
 * Helpers pour standardiser les réponses API (succès, erreur, validation).
 * Voir backend/docs/MESSAGES_API.md pour le format attendu côté frontend.
 */

/**
 * Réponse succès
 * @param {import('express').Response} res
 * @param {number} statusCode - 200 ou 201
 * @param {string} [message]
 * @param {object} [data] - payload optionnel (user, token, invoice, etc.)
 */
function successRes(res, statusCode = 200, message, data = undefined) {
  const payload = { success: true };
  if (message) payload.message = message;
  if (data !== undefined) {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      Object.assign(payload, data);
    } else {
      payload.data = data;
    }
  }
  return res.status(statusCode).json(payload);
}

/**
 * Réponse erreur métier
 * @param {import('express').Response} res
 * @param {number} statusCode - 4xx ou 5xx
 * @param {string} message
 */
function errorRes(res, statusCode, message) {
  return res.status(statusCode).json({ success: false, message });
}

/**
 * Réponse erreurs de validation (express-validator)
 * @param {import('express').Response} res
 * @param {Array<{ msg: string, path?: string }>} errors - errors.array()
 * @param {number} [statusCode=400]
 */
function validationRes(res, errors, statusCode = 400) {
  return res.status(statusCode).json({ errors });
}

module.exports = {
  successRes,
  errorRes,
  validationRes,
};
