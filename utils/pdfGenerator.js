/**
 * Générateur de PDF pour les factures
 * 
 * Note: Pour utiliser cette fonctionnalité, installer pdfkit:
 * npm install pdfkit
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../log/logger');

const PDF_MESSAGES = {
  PDF_GENERATED: (invoiceNumber) => `PDF généré pour la facture ${invoiceNumber}`,
  PDF_ERROR: 'Erreur lors de la génération du PDF:',
};

/**
 * Génère un PDF pour une facture
 * @param {Object} invoice - Objet facture
 * @param {string} outputPath - Chemin de sortie du PDF
 * @returns {Promise<string>} - Chemin du fichier PDF généré
 */
const generateInvoicePDF = async (invoice, outputPath) => {
  try {
    // Vérifier si pdfkit est installé
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch (error) {
      throw new Error('pdfkit n\'est pas installé. Exécutez: npm install pdfkit');
    }

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // En-tête
    doc.fontSize(20).text('ZETOUN LABS', { align: 'center' });
    doc.fontSize(12).text('L\'expertise au service de votre avenir numérique', { align: 'center' });
    doc.moveDown(2);

    // Informations de facture
    doc.fontSize(16).text('FACTURE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10);
    doc.text(`N° Facture: ${invoice.invoiceNumber}`, { align: 'left' });
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, { align: 'left' });
    doc.text(`Statut: ${invoice.status.toUpperCase()}`, { align: 'left' });
    doc.moveDown();

    // Informations client
    doc.fontSize(12).text('Informations Client:', { underline: true });
    doc.fontSize(10);
    doc.text(`Nom: ${invoice.clientInfo.name}`);
    doc.text(`Email: ${invoice.clientInfo.email}`);
    if (invoice.clientInfo.phone) {
      doc.text(`Téléphone: ${invoice.clientInfo.phone}`);
    }
    if (invoice.clientInfo.address) {
      const addr = invoice.clientInfo.address;
      if (addr.street) doc.text(`Adresse: ${addr.street}`);
      if (addr.city || addr.postalCode) {
        doc.text(`${addr.postalCode || ''} ${addr.city || ''}`.trim());
      }
      if (addr.country) doc.text(`Pays: ${addr.country}`);
    }
    doc.moveDown();

    // Tableau des articles
    doc.fontSize(12).text('Articles:', { underline: true });
    doc.moveDown(0.5);

    // En-tête du tableau
    const tableTop = doc.y;
    doc.fontSize(10);
    doc.text('#', 50, tableTop);
    doc.text('Formation', 80, tableTop);
    doc.text('Qté', 350, tableTop);
    doc.text('Prix unit.', 400, tableTop, { align: 'right' });
    doc.text('Total', 480, tableTop, { align: 'right' });

    // Ligne de séparation
    doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();

    // Articles
    let yPos = doc.y + 10;
    invoice.items.forEach((item, index) => {
      doc.text((index + 1).toString(), 50, yPos);
      doc.text(item.title, 80, yPos, { width: 250 });
      doc.text(item.quantity.toString(), 350, yPos);
      doc.text(`${item.price.toFixed(2)} $`, 400, yPos, { align: 'right' });
      doc.text(`${(item.price * item.quantity).toFixed(2)} $`, 480, yPos, { align: 'right' });
      yPos += 20;
    });

    doc.moveDown();

    // Totaux
    const totalsY = doc.y;
    doc.text('Sous-total:', 350, totalsY, { align: 'right' });
    doc.text(`${invoice.subtotal.toFixed(2)} $`, 480, totalsY, { align: 'right' });

    if (invoice.tax > 0) {
      doc.text('Taxe:', 350, doc.y + 15, { align: 'right' });
      doc.text(`${invoice.tax.toFixed(2)} $`, 480, doc.y, { align: 'right' });
    }

    if (invoice.discount > 0) {
      doc.text('Remise:', 350, doc.y + 15, { align: 'right' });
      doc.text(`-${invoice.discount.toFixed(2)} $`, 480, doc.y, { align: 'right' });
    }

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL TTC:', 350, doc.y + 20, { align: 'right' });
    doc.text(`${invoice.total.toFixed(2)} $`, 480, doc.y, { align: 'right' });

    // Notes
    if (invoice.notes) {
      doc.moveDown(2);
      doc.fontSize(10).font('Helvetica');
      doc.text('Notes:', { underline: true });
      doc.text(invoice.notes, { width: 500 });
    }

    // Pied de page
    doc.fontSize(8);
    doc.text('Merci pour votre confiance !', 50, doc.page.height - 100, { align: 'center' });
    doc.text('www.zetounlabs.com', 50, doc.page.height - 85, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        logger.info(PDF_MESSAGES.PDF_GENERATED(invoice.invoiceNumber));
        resolve(outputPath);
      });
      stream.on('error', reject);
    });
  } catch (error) {
    logger.error(PDF_MESSAGES.PDF_ERROR, { message: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = {
  generateInvoicePDF,
};
