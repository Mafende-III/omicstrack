import PDFDocument from 'pdfkit';

const MARGIN = 50;
const FONT_SIZE_TITLE = 16;
const FONT_SIZE_HEADING = 12;
const FONT_SIZE_BODY = 10;
const FONT_SIZE_SMALL = 8;
const LINE_GAP = 4;

/**
 * Generate a consent form PDF with embedded signatures.
 *
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.studyTitle
 * @param {Array}  opts.sections - [{heading, body}]
 * @param {string} opts.consentStatement
 * @param {string} opts.consentSectionLabel - localized "Consent Form" heading
 * @param {string} opts.participantName
 * @param {string} opts.participantLabel
 * @param {string} opts.researcherName
 * @param {string} opts.researcherLabel
 * @param {string} opts.signatureAndDateLabel
 * @param {string} opts.doneAtLabel
 * @param {string} opts.doneAtValue - facility or location
 * @param {string} opts.patientCode
 * @param {string} opts.patientSignatureBase64 - data:image/png;base64,...
 * @param {string} opts.researcherSignatureBase64
 * @param {string} opts.signedDate - ISO date string
 * @returns {Promise<Buffer>}
 */
export async function generateConsentPdf(opts) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - MARGIN * 2;

    // Title
    doc
      .fontSize(FONT_SIZE_TITLE)
      .font('Helvetica-Bold')
      .text(opts.title || 'Informed Consent Form', { align: 'center' });

    doc.moveDown(0.5);

    doc
      .fontSize(FONT_SIZE_HEADING)
      .font('Helvetica-Bold')
      .text(opts.studyTitle, { align: 'center' });

    doc.moveDown(1);

    // Sections
    for (const section of opts.sections) {
      checkPageBreak(doc, 80);

      doc
        .fontSize(FONT_SIZE_HEADING)
        .font('Helvetica-Bold')
        .text(section.heading);

      doc.moveDown(0.3);

      doc
        .fontSize(FONT_SIZE_BODY)
        .font('Helvetica')
        .text(section.body, { lineGap: LINE_GAP });

      doc.moveDown(0.8);

      // Divider line
      const y = doc.y;
      doc
        .moveTo(MARGIN, y)
        .lineTo(MARGIN + pageWidth, y)
        .strokeColor('#cccccc')
        .lineWidth(0.5)
        .stroke();

      doc.moveDown(0.5);
    }

    // Consent statement
    checkPageBreak(doc, 200);

    doc
      .fontSize(FONT_SIZE_HEADING)
      .font('Helvetica-Bold')
      .text(opts.consentSectionLabel || 'Consent Form');

    doc.moveDown(0.5);

    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica')
      .text(opts.consentStatement, { lineGap: LINE_GAP });

    doc.moveDown(1.5);

    // Signature blocks
    checkPageBreak(doc, 180);

    const sigWidth = 150;
    const sigHeight = 50;
    const colWidth = pageWidth / 2;

    // 1. Participant
    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica-Bold')
      .text(`1. ${opts.participantLabel}`, MARGIN);

    doc.moveDown(0.3);

    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica')
      .text(opts.participantName || '____________________', MARGIN);

    if (opts.patientSignatureBase64) {
      try {
        const sigData = decodeBase64Image(opts.patientSignatureBase64);
        if (sigData) {
          doc.image(sigData, MARGIN, doc.y + 4, { width: sigWidth, height: sigHeight });
          doc.y += sigHeight + 8;
        }
      } catch {
        // skip if signature can't be decoded
      }
    }

    doc
      .fontSize(FONT_SIZE_SMALL)
      .font('Helvetica')
      .text(`${opts.signatureAndDateLabel}: ${opts.signedDate || ''}`, MARGIN);

    doc.moveDown(1);

    // 2. Researcher
    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica-Bold')
      .text(`2. ${opts.researcherLabel}`, MARGIN);

    doc.moveDown(0.3);

    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica')
      .text(opts.researcherName || '____________________', MARGIN);

    if (opts.researcherSignatureBase64) {
      try {
        const sigData = decodeBase64Image(opts.researcherSignatureBase64);
        if (sigData) {
          doc.image(sigData, MARGIN, doc.y + 4, { width: sigWidth, height: sigHeight });
          doc.y += sigHeight + 8;
        }
      } catch {
        // skip
      }
    }

    doc
      .fontSize(FONT_SIZE_SMALL)
      .font('Helvetica')
      .text(`${opts.signatureAndDateLabel}: ${opts.signedDate || ''}`, MARGIN);

    doc.moveDown(1);

    // Done at
    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica-Bold')
      .text(`${opts.doneAtLabel}: `, { continued: true })
      .font('Helvetica')
      .text(opts.doneAtValue || '____________________');

    drawFooter(doc, opts.patientCode, pageWidth);

    doc.end();
  });
}

/**
 * Generate a questionnaire PDF with all answered fields.
 *
 * @param {Object} opts
 * @param {string} opts.patientCode
 * @param {string} opts.patientName
 * @param {Object} opts.sectionDefs - { A: [{id, label}], B: [...], ... }
 * @param {Object} opts.answers - { q_age: '48', q_married: 'Yes', ... }
 * @param {string} opts.submittedAt
 * @param {string} opts.submittedBy - user name
 * @param {string} opts.lang - 'en', 'fr', or 'ki'
 * @returns {Promise<Buffer>}
 */
export async function generateQuestionnairePdf(opts) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - MARGIN * 2;

    // Title
    doc
      .fontSize(FONT_SIZE_TITLE)
      .font('Helvetica-Bold')
      .text('Patient Questionnaire', { align: 'center' });

    doc.moveDown(0.3);

    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica')
      .text('Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population', { align: 'center' });

    doc.moveDown(1);

    // Patient info box
    doc
      .fontSize(FONT_SIZE_BODY)
      .font('Helvetica-Bold')
      .text(`Patient Code: `, { continued: true })
      .font('Helvetica')
      .text(opts.patientCode);

    if (opts.patientName) {
      doc
        .font('Helvetica-Bold')
        .text(`Patient Name: `, { continued: true })
        .font('Helvetica')
        .text(opts.patientName);
    }

    doc
      .font('Helvetica-Bold')
      .text(`Submitted: `, { continued: true })
      .font('Helvetica')
      .text(`${opts.submittedAt || ''} by ${opts.submittedBy || ''}`);

    doc.moveDown(1);

    // Divider
    drawDivider(doc, pageWidth);

    // Sections
    const sectionLabels = {
      A: 'A. Identity',
      B: 'B. Socio-economic',
      C: 'C. Health History',
      D: 'D. Clinical / Diagnosis',
      E: 'E. Treatment History',
      F: 'F. Environmental',
    };

    for (const [sectionKey, fields] of Object.entries(opts.sectionDefs)) {
      checkPageBreak(doc, 60);

      doc
        .fontSize(FONT_SIZE_HEADING)
        .font('Helvetica-Bold')
        .text(sectionLabels[sectionKey] || `Section ${sectionKey}`);

      doc.moveDown(0.4);

      for (const field of fields) {
        const answer = opts.answers[field.id];
        if (answer === undefined || answer === null || answer === '') continue;

        checkPageBreak(doc, 30);

        doc
          .fontSize(FONT_SIZE_BODY)
          .font('Helvetica-Bold')
          .text(`${field.label}: `, { continued: true })
          .font('Helvetica')
          .text(String(answer));
      }

      doc.moveDown(0.6);
      drawDivider(doc, pageWidth);
    }

    drawFooter(doc, opts.patientCode, pageWidth);

    doc.end();
  });
}

// --- Helpers ---

// Draw a footer on every existing page WITHOUT triggering pdfkit's auto-pagination.
// pdfkit's `text()` advances the internal cursor and can call addPage() if the
// post-write position spills past the bottom margin, even with `lineBreak: false`.
// To avoid that we temporarily disable the bottom margin while writing the footer,
// then restore it.
function drawFooter(doc, patientCode, pageWidth) {
  const { start, count } = doc.bufferedPageRange();
  const originalBottomMargin = doc.page.margins.bottom;
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    doc.page.margins.bottom = 0;
    doc
      .fontSize(FONT_SIZE_SMALL)
      .font('Helvetica')
      .text(
        `Patient ${patientCode} | Page ${i + 1} of ${count}`,
        MARGIN,
        doc.page.height - MARGIN + 10,
        { align: 'center', width: pageWidth, lineBreak: false }
      );
    doc.page.margins.bottom = originalBottomMargin;
  }
}

function checkPageBreak(doc, neededSpace) {
  if (doc.y + neededSpace > doc.page.height - MARGIN) {
    doc.addPage();
  }
}

function drawDivider(doc, pageWidth) {
  const y = doc.y;
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN + pageWidth, y)
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .stroke();
  doc.moveDown(0.5);
}

function decodeBase64Image(dataUrl) {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], 'base64');
}
