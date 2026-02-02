const nodemailer = require("nodemailer");
const { logger } = require("../log/logger");

const EMAIL_MESSAGES = {
  SMTP_ERROR: "Erreur de connexion SMTP :",
  SMTP_READY: "Serveur SMTP prêt à prendre des messages",
  ADMIN_NOTIFICATION_SUBJECT: (subject, name) =>
    `[Nouvelle Demande Client] ${subject} - ${name}`,
  ADMIN_NOTIFICATION_INFO: (email) =>
    `Notification admin envoyée pour ${email}`,
  ADMIN_NOTIFICATION_ERROR: (email) =>
    `Erreur lors de l'envoi de l'e-mail de notification à l'admin pour ${email}:`,
  CLIENT_CONFIRMATION_SUBJECT: "Votre demande a été reçue - Zetoun Labs",
  CLIENT_CONFIRMATION_INFO: (email) => `Confirmation client envoyée à ${email}`,
  CLIENT_CONFIRMATION_ERROR: (email) =>
    `Erreur lors de l'envoi de l'e-mail de confirmation au client ${email}:`,
};

/** Échappe les caractères HTML pour affichage sécurisé dans les e-mails */
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.zetounlabs.com";
const DEFAULT_EMAIL_PORT = 587;
const SEND_EMAIL_MAX_RETRIES = 3;
const SEND_EMAIL_RETRY_DELAY_MS = 2000;

const HTML_STYLES = {
  /* Notification admin – style aligné Zetoun Labs */
  MAIN_DIV:
    "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.65; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #1a1a1a; border-radius: 8px; overflow: hidden; background-color: #fff;",
  HEADER_DIV:
    "background-color: #f0f0f0; color: #1a1a1a; padding: 24px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;",
  H1_TITLE:
    "color: #1a1a1a; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0;",
  P_SUBTITLE: "color: #444444; font-size: 14px; margin: 6px 0 0;",
  CONTENT_DIV: "padding: 28px 24px;",
  P_BODY: "font-size: 15px; margin: 0 0 16px; color: #333;",
  H3_DETAILS:
    "color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin: 24px 0 14px; font-size: 17px; font-weight: 600;",
  TABLE_STYLE: "width: 100%; border-collapse: collapse; font-size: 15px;",
  TABLE_TD_BOLD:
    "padding: 10px 8px 10px 0; font-weight: 600; width: 32%; color: #1a1a1a;",
  TABLE_TD_NORMAL: "padding: 10px 0; color: #555;",
  MESSAGE_DIV:
    "background-color: #f9f9f9; border-left: 4px solid #1a1a1a; padding: 18px; margin-top: 20px; border-radius: 0 6px 6px 0;",
  MESSAGE_H3:
    "color: #1a1a1a; margin: 0 0 10px; font-size: 16px; font-weight: 600;",
  MESSAGE_P:
    "white-space: pre-wrap; margin: 0; color: #555; font-size: 15px; line-height: 1.6;",
  FOOTER_DIV:
    "background-color: #f5f5f5; color: #666; padding: 16px; text-align: center; font-size: 12px; border-top: 1px solid #eee;",

  CLIENT_MAIN_DIV:
    "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.65; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #000; border-radius: 8px; overflow: hidden; background-color: #fff;",
  CLIENT_HEADER_DIV:
    "background-color: #f0f0f0; color: #1a1a1a; padding: 28px 25px; text-align: center; border-bottom: 1px solid #e0e0e0;",
  CLIENT_H1_TITLE:
    "color: #1a1a1a; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0;",
  CLIENT_P_SUBTITLE: "color: #444444; margin: 8px 0 0; font-size: 15px;",
  CLIENT_CONTENT_DIV: "padding: 32px 28px;",
  CLIENT_P_REGULAR: "font-size: 16px; margin: 0 0 14px; color: #333;",
  CLIENT_P_BOLD_TEXT: "color: #000; font-weight: 600;",
  CLIENT_P_MARGIN_TOP: "margin-top: 22px;",
  CLIENT_P_SMALL_FONT: "font-size: 15px; color: #555;",
  CLIENT_LINK_STYLE:
    "color: #1a1a1a; text-decoration: underline; font-weight: 600;",
  CLIENT_FOOTER_DIV:
    "background-color: #f5f5f5; color: #666; padding: 18px; text-align: center; font-size: 12px; border-top: 1px solid #eee;",
  CLIENT_BOX:
    "background-color: #f9f9f9; border-left: 4px solid #1a1a1a; padding: 16px 18px; margin: 20px 0; border-radius: 0 6px 6px 0;",
  CLIENT_CTA_BTN:
    "display: inline-block; background-color: #1a1a1a; color: #fff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin-top: 8px;",
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || String(DEFAULT_EMAIL_PORT), 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    logger.error(EMAIL_MESSAGES.SMTP_ERROR, {
      message: error.message,
      code: error.code,
      command: error.command,
    });
  } else {
    logger.info(EMAIL_MESSAGES.SMTP_READY);
  }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendEmailWithRetry = async (
  mailOptions,
  maxRetries = SEND_EMAIL_MAX_RETRIES,
  retryDelayMs = SEND_EMAIL_RETRY_DELAY_MS,
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      logger.warn(
        `Tentative ${attempt}/${maxRetries} d'envoi d'e-mail échouée. Cible : ${mailOptions.to}. Erreur : ${error.message}`,
      );
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
      } else {
        throw error;
      }
    }
  }
};

/** E-mail de notification envoyé à l'admin lorsqu'un client soumet le formulaire de contact */
const sendAdminNotificationEmail = async ({
  name,
  email,
  subject,
  message,
}) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  const adminMailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: EMAIL_MESSAGES.ADMIN_NOTIFICATION_SUBJECT(subject, name),
    html: `
      <div style="${HTML_STYLES.MAIN_DIV}">
          <div style="${HTML_STYLES.HEADER_DIV}">
              <h1 style="${HTML_STYLES.H1_TITLE}">ZETOUN LABS</h1>
              <p style="${HTML_STYLES.P_SUBTITLE}">Nouvelle demande client – Formulaire de contact</p>
          </div>
          <div style="${HTML_STYLES.CONTENT_DIV}">
              <p style="${HTML_STYLES.P_BODY}">Une nouvelle demande a été soumise via le formulaire de contact du site. Merci de traiter cette demande sous 48 h ouvrées.</p>
              <h3 style="${HTML_STYLES.H3_DETAILS}">Coordonnées et sujet</h3>
              <table style="${HTML_STYLES.TABLE_STYLE}">
                  <tr>
                      <td style="${HTML_STYLES.TABLE_TD_BOLD}">Nom :</td>
                      <td style="${HTML_STYLES.TABLE_TD_NORMAL}">${safeName}</td>
                  </tr>
                  <tr>
                      <td style="${HTML_STYLES.TABLE_TD_BOLD}">E-mail (répondre à) :</td>
                      <td style="${HTML_STYLES.TABLE_TD_NORMAL}"><a href="mailto:${safeEmail}" style="color: #1a1a1a; font-weight: 600;">${safeEmail}</a></td>
                  </tr>
                  <tr>
                      <td style="${HTML_STYLES.TABLE_TD_BOLD}">Sujet :</td>
                      <td style="${HTML_STYLES.TABLE_TD_NORMAL}">${safeSubject}</td>
                  </tr>
              </table>
              <div style="${HTML_STYLES.MESSAGE_DIV}">
                  <h3 style="${HTML_STYLES.MESSAGE_H3}">Message du client</h3>
                  <p style="${HTML_STYLES.MESSAGE_P}">${safeMessage}</p>
              </div>
          </div>
          <div style="${HTML_STYLES.FOOTER_DIV}">
              Notification automatique – Zetoun Labs. Répondre au client à l'adresse indiquée ci-dessus.
          </div>
      </div>
    `,
  };

  try {
    await sendEmailWithRetry(adminMailOptions);
    logger.info(EMAIL_MESSAGES.ADMIN_NOTIFICATION_INFO(email));
  } catch (error) {
    logger.error(EMAIL_MESSAGES.ADMIN_NOTIFICATION_ERROR(email), {
      message: error.message,
      stack: error.stack,
    });
  }
};

/** E-mail de confirmation envoyé au client après envoi du formulaire de contact */
const sendClientConfirmationEmail = async ({ name, email, subject }) => {
  const safeName = escapeHtml(name);
  const safeSubject = escapeHtml(subject);

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
              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">Bonjour <strong style="${HTML_STYLES.CLIENT_P_BOLD_TEXT}">${safeName}</strong>,</p>
              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">Merci d'avoir pris contact avec nous. Nous avons bien reçu votre demande et nous vous en remercions.</p>

              <div style="${HTML_STYLES.CLIENT_BOX}">
                  <p style="margin: 0; font-size: 14px; color: #555;">Rappel de votre demande</p>
                  <p style="margin: 6px 0 0; font-weight: 600; color: #1a1a1a;">« ${safeSubject} »</p>
              </div>

              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">Un membre de notre équipe étudie votre requête et vous répondra personnellement sous <strong style="${HTML_STYLES.CLIENT_P_BOLD_TEXT}">48 heures ouvrables</strong> (hors week-ends et jours fériés) avec des conseils adaptés ou des propositions concrètes.</p>

              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">En attendant, vous pouvez découvrir notre calendrier des formations et nos services IT :</p>
              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">
                  <a href="${FRONTEND_URL}/add/calendar-form" style="${HTML_STYLES.CLIENT_CTA_BTN}">Voir le calendrier des formations</a>
              </p>

              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP} ${HTML_STYLES.CLIENT_P_REGULAR}">Nous restons à votre disposition pour toute question.</p>
              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP} ${HTML_STYLES.CLIENT_P_SMALL_FONT}">
                  Cordialement,<br/>
                  <strong>L'équipe Zetoun Labs</strong><br/>
                  <a href="${FRONTEND_URL}" style="color: #1a1a1a; text-decoration: none;">${FRONTEND_URL.replace(/^https?:\/\//, "")}</a>
              </p>
          </div>
          <div style="${HTML_STYLES.CLIENT_FOOTER_DIV}">
              Cet e-mail a été envoyé automatiquement suite à votre demande sur notre site. Pour toute question, utilisez le formulaire de contact sur le site.
          </div>
      </div>
    `,
  };

  try {
    await sendEmailWithRetry(clientMailOptions);
    logger.info(EMAIL_MESSAGES.CLIENT_CONFIRMATION_INFO(email));
  } catch (error) {
    logger.error(EMAIL_MESSAGES.CLIENT_CONFIRMATION_ERROR(email), {
      message: error.message,
      stack: error.stack,
    });
  }
};

const sendInvoiceConfirmationEmail = async ({
  invoiceNumber,
  clientName,
  clientEmail,
  items,
  total,
}) => {
  const safeClientName = escapeHtml(clientName);
  const itemsList = items
    .map((item, index) => {
      const title = escapeHtml(item.title || "");
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      return `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px;">${index + 1}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px;">${title}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: center; font-size: 14px;">${qty}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px;">${price.toFixed(2)} $</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #eee; text-align: right; font-size: 14px;">${(price * qty).toFixed(2)} $</td>
    </tr>
  `;
    })
    .join("");

  const clientMailOptions = {
    from: process.env.EMAIL_FROM,
    to: clientEmail,
    subject: `Facture ${invoiceNumber} - Zetoun Labs`,
    html: `
      <div style="${HTML_STYLES.CLIENT_MAIN_DIV}">
          <div style="${HTML_STYLES.CLIENT_HEADER_DIV}">
              <h1 style="${HTML_STYLES.CLIENT_H1_TITLE}">ZETOUN LABS</h1>
              <p style="${HTML_STYLES.CLIENT_P_SUBTITLE}">Confirmation de votre facture</p>
          </div>
          <div style="${HTML_STYLES.CLIENT_CONTENT_DIV}">
              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">Bonjour <strong style="${HTML_STYLES.CLIENT_P_BOLD_TEXT}">${safeClientName}</strong>,</p>
              <p style="${HTML_STYLES.CLIENT_P_REGULAR}">Merci pour votre commande. Votre facture a bien été enregistrée. Conservez cet e-mail pour vos dossiers.</p>

              <div style="margin-top: 24px;">
                <h3 style="color: #1a1a1a; font-size: 17px; margin: 0 0 12px; font-weight: 600;">Facture N° ${escapeHtml(String(invoiceNumber))}</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #1a1a1a; font-weight: 600;">#</th>
                      <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #1a1a1a; font-weight: 600;">Formation</th>
                      <th style="padding: 10px 8px; text-align: center; border-bottom: 2px solid #1a1a1a; font-weight: 600;">Qté</th>
                      <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #1a1a1a; font-weight: 600;">Prix unit.</th>
                      <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #1a1a1a; font-weight: 600;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsList}
                    <tr>
                      <td colspan="4" style="padding: 12px 8px; text-align: right; font-weight: 700; border-top: 2px solid #1a1a1a; font-size: 15px;">Total TTC</td>
                      <td style="padding: 12px 8px; text-align: right; font-weight: 700; border-top: 2px solid #1a1a1a; font-size: 15px;">${Number(total).toFixed(2)} $</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style="${HTML_STYLES.CLIENT_BOX}">
                  <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #1a1a1a;">Prochaines étapes</p>
                  <p style="margin: 0; font-size: 14px; color: #555;">Vous pouvez consulter le calendrier des formations et vos inscriptions depuis votre espace sur notre site.</p>
                  <p style="margin: 10px 0 0;">
                      <a href="${FRONTEND_URL}/add/calendar-form" style="${HTML_STYLES.CLIENT_CTA_BTN}">Accéder au calendrier</a>
                  </p>
              </div>

              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP} ${HTML_STYLES.CLIENT_P_SMALL_FONT}">Pour toute question concernant cette facture ou vos formations, n'hésitez pas à nous contacter via le formulaire sur le site.</p>

              <p style="${HTML_STYLES.CLIENT_P_MARGIN_TOP} ${HTML_STYLES.CLIENT_P_SMALL_FONT}">
                  Cordialement,<br/>
                  <strong>L'équipe Zetoun Labs</strong><br/>
                  <a href="${FRONTEND_URL}" style="color: #1a1a1a; text-decoration: none;">${FRONTEND_URL.replace(/^https?:\/\//, "")}</a>
              </p>
          </div>
          <div style="${HTML_STYLES.CLIENT_FOOTER_DIV}">
              Cet e-mail confirme l'enregistrement de votre facture. Conservez-le pour vos archives.
          </div>
      </div>
    `,
  };

  try {
    await sendEmailWithRetry(clientMailOptions);
    logger.info(`Email de confirmation de facture envoyé à ${clientEmail}`, {
      invoiceNumber,
    });
  } catch (error) {
    logger.error(
      `Erreur lors de l'envoi de l'email de confirmation de facture à ${clientEmail}:`,
      {
        message: error.message,
        stack: error.stack,
      },
    );
  }
};

module.exports = {
  sendAdminNotificationEmail,
  sendClientConfirmationEmail,
  sendInvoiceConfirmationEmail,
};
