const nodemailer = require('nodemailer');
const { logger } = require('../log/logger');

const EMAIL_MESSAGES = {
  SMTP_ERROR: "Erreur de connexion SMTP :",
  SMTP_READY: "Serveur SMTP prêt à prendre des messages",
  ADMIN_NOTIFICATION_SUBJECT: (subject, name) => `[Nouvelle Demande Client] ${subject} - ${name}`,
  ADMIN_NOTIFICATION_INFO: (email) => `Notification admin envoyée pour ${email}`,
  ADMIN_NOTIFICATION_ERROR: (email) => `Erreur lors de l'envoi de l'e-mail de notification à l'admin pour ${email}:`,
  CLIENT_CONFIRMATION_SUBJECT: 'Votre demande a été reçue - Zetoun Labs',
  CLIENT_CONFIRMATION_INFO: (email) => `Confirmation client envoyée à ${email}`,
  CLIENT_CONFIRMATION_ERROR: (email) => `Erreur lors de l'envoi de l'e-mail de confirmation au client ${email}:`,
};

const HTML_STYLES = {
  MAIN_DIV: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background-color: #fff;",
  HEADER_DIV: "background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 1px solid #eee;",
  H1_TITLE: "color: #333; margin: 0; font-size: 24px;",
  P_SUBTITLE: "color: #666; font-size: 14px;",
  CONTENT_DIV: "padding: 25px;",
  P_BODY: "font-size: 16px;",
  H3_DETAILS: "color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 25px; margin-bottom: 15px;",
  TABLE_STYLE: "width: 100%; border-collapse: collapse; font-size: 15px;",
  TABLE_TD_BOLD: "padding: 8px 0; font-weight: bold; width: 30%;",
  TABLE_TD_NORMAL: "padding: 8px 0; color: #555;",
  MESSAGE_DIV: "background-color: #fcfcfc; border: 1px solid #eee; padding: 15px; margin-top: 25px; border-radius: 4px;",
  MESSAGE_H3: "color: #333; margin-top: 0; font-size: 18px;",
  MESSAGE_P: "white-space: pre-wrap; margin: 0; color: #555;",
  FOOTER_DIV: "background-color: #f8f8f8; color: #777; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #eee;",

  CLIENT_MAIN_DIV: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #000; border-radius: 4px; overflow: hidden; background-color: #fff;",
  CLIENT_HEADER_DIV: "background-color: #000; color: #fff; padding: 25px; text-align: center; border-bottom: 1px solid #333;",
  CLIENT_H1_TITLE: "margin: 0; font-size: 28px; letter-spacing: 1px;",
  CLIENT_P_SUBTITLE: "margin: 5px 0 0; font-size: 16px; opacity: 0.8;",
  CLIENT_CONTENT_DIV: "padding: 30px;",
  CLIENT_P_REGULAR: "font-size: 16px; margin-top: 0;",
  CLIENT_P_BOLD_TEXT: "color: #000;",
  CLIENT_P_MARGIN_TOP: "margin-top: 25px;",
  CLIENT_P_SMALL_FONT: "font-size: 15px;",
  CLIENT_LINK_STYLE: "color: #000; text-decoration: underline; font-weight: bold;",
  CLIENT_FOOTER_DIV: "background-color: #f8f8f8; color: #777; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #eee;",
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function(error, success) {
  if (error) {
    logger.error(EMAIL_MESSAGES.SMTP_ERROR, error);
  } else {
    logger.info(EMAIL_MESSAGES.SMTP_READY);
  }
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendEmailWithRetry = async (mailOptions, maxRetries = 3, retryDelayMs = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      logger.warn(`Tentative ${attempt}/${maxRetries} d'envoi d'e-mail échouée. Cible : ${mailOptions.to}. Erreur : ${error.message}`);
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
      } else {
        throw error;
      }
    }
  }
};

const sendAdminNotificationEmail = async ({ name, email, subject, message }) => {
  const adminMailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: EMAIL_MESSAGES.ADMIN_NOTIFICATION_SUBJECT(subject, name),
    html: `
      <div style="${HTML_STYLES.MAIN_DIV}">
          <div style="${HTML_STYLES.HEADER_DIV}">
              <h1 style="${HTML_STYLES.H1_TITLE}">Nouvelle demande client</h1>
              <p style="${HTML_STYLES.P_SUBTITLE}">Zetoun Labs - Notification Système</p>
          </div>
          <div style="${HTML_STYLES.CONTENT_DIV}">
              <p style="${HTML_STYLES.P_BODY}">Une nouvelle demande a été soumise via le formulaire de contact du site web.</p>
              <h3 style="${HTML_STYLES.H3_DETAILS}">Détails de la demande :</h3>
              <table style="${HTML_STYLES.TABLE_STYLE}">
                  <tr>
                      <td style="${HTML_STYLES.TABLE_TD_BOLD}">Nom complet :</td>
                      <td style="${HTML_STYLES.TABLE_TD_NORMAL}">${name}</td>
                  </tr>
                  <tr>
                      <td style="${HTML_STYLES.TABLE_TD_BOLD}">Adresse e-mail :</td>
                      <td style="${HTML_STYLES.TABLE_TD_NORMAL}">${email}</td>
                  </tr>
                  <tr>
                      <td style="${HTML_STYLES.TABLE_TD_BOLD}">Sujet de la demande :</td>
                      <td style="${HTML_STYLES.TABLE_TD_NORMAL}">${subject}</td>
                  </tr>
              </table>
              <div style="${HTML_STYLES.MESSAGE_DIV}">
                  <h3 style="${HTML_STYLES.MESSAGE_H3}">Message de l'utilisateur :</h3>
                  <p style="${HTML_STYLES.MESSAGE_P}">${message.replace(/\n/g, '<br>')}</p>
              </div>
          </div>
          <div style="${HTML_STYLES.FOOTER_DIV}">
              Ceci est une notification système automatique de Zetoun Labs. Veuillez ne pas y répondre directement.
          </div>
      </div>
    `,
  };

  try {
    await sendEmailWithRetry(adminMailOptions);
    logger.info(EMAIL_MESSAGES.ADMIN_NOTIFICATION_INFO(email));
  } catch (error) {
    logger.error(EMAIL_MESSAGES.ADMIN_NOTIFICATION_ERROR(email), { message: error.message, stack: error.stack });
  }
};

const sendClientConfirmationEmail = async ({ name, email, subject }) => {
  const clientMailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: EMAIL_MESSAGES.CLIENT_CONFIRMATION_SUBJECT,
    html: `
      <div style="${HTML_STYLES.CLIENT_MAIN_DIV}">
          <div style="${HTML_STYLES.CLIENT_HEADER_DIV}">
              <h1 style="${HTML_STYLES.CLIENT_H1_TITLE}">ZETOUN LABS</h1>
              <p style="${HTML_STYLES.CLIENT_P_SUBTITLE}">L'expertise au service de votre avenir numérique</p>
          </div>
          <div style="${HTML_STYLES.CLIENT_CONTENT_DIV}">
              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">Cher(e) <strong style="${HTML_STYLES.CLIENT_P_BOLD_TEXT}">${name}</strong>,</p>
              <p>Nous vous confirmons avec plaisir la bonne réception de votre demande concernant : <strong style="${HTML_STYLES.CLIENT_P_BOLD_TEXT}">"${subject}"</strong>.</p>
              <p>Votre démarche est précieuse pour Zetoun Labs. Nous nous engageons à vous offrir une réponse de qualité dans les meilleurs délais.</p>
              <p>Un membre de notre équipe d'experts examinera votre requête avec la plus grande attention et vous contactera personnellement sous **48 heures ouvrables** afin de vous apporter une solution adaptée ou des conseils pertinents.</p>
              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP}">En attendant notre prise de contact, n'hésitez pas à explorer nos différentes <a href="${process.env.FRONTEND_URL}/formations" style="${HTML_STYLES.CLIENT_LINK_STYLE}">formations IT sur notre site web</a>. Vous y trouverez peut-être des opportunités pour renforcer vos compétences ou celles de votre équipe.</p>
              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP}">Nous vous remercions de votre confiance et sommes impatients d'échanger avec vous.</p>
              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP} ${HTML_STYLES.CLIENT_P_SMALL_FONT}">
                  Cordialement,<br/>
                  L'équipe de Zetoun Labs<br/>
                  <a href="${process.env.FRONTEND_URL}" style="color: #000; text-decoration: none;">www.zetounlabs.cd</a>
              </p>
          </div>
          <div style="${HTML_STYLES.CLIENT_FOOTER_DIV}">
              Ceci est un e-mail automatique. Veuillez ne pas y répondre.
          </div>
      </div>
    `,
  };

  try {
    await sendEmailWithRetry(clientMailOptions);
    logger.info(EMAIL_MESSAGES.CLIENT_CONFIRMATION_INFO(email));
  } catch (error) {
    logger.error(EMAIL_MESSAGES.CLIENT_CONFIRMATION_ERROR(email), { message: error.message, stack: error.stack });
  }
};

module.exports = {
  sendAdminNotificationEmail,
  sendClientConfirmationEmail,
};
