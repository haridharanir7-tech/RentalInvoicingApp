const PDFDocument = require('pdfkit');

// Generates a PDF stream for an invoice
exports.createInvoicePdf = (invoiceData, dataCallback, endCallback) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // Colors
  const headerColor = invoiceData.header_colour || '#1e3a8a';
  const accentColor = invoiceData.accent_colour || '#3b82f6';

  // Header Title
  doc.fillColor(headerColor).fontSize(20).text(invoiceData.business_name || 'TAX INVOICE', 50, 50);
  doc.fontSize(10).fillColor('#666666').text(invoiceData.landlord_address || '', 50, 75);
  doc.text(`PAN: ${invoiceData.landlord_pan || 'N/A'} | GSTIN: ${invoiceData.landlord_gstin || 'Unregistered'}`, 50, 90);

  doc.moveDown();
  doc.strokeColor(accentColor).lineWidth(2).moveTo(50, 115).lineTo(550, 115).stroke();

  // Invoice Details
  doc.fontSize(12).fillColor('#000000').text(`Invoice #: ${invoiceData.invoice_number}`, 50, 130);
  doc.text(`Date: ${invoiceData.invoice_date}`, 50, 145);
  doc.text(`Billing Period: ${invoiceData.billing_period}`, 50, 160);

  // Tenant Details
  doc.text(`Billed To: ${invoiceData.tenant_name}`, 320, 130);
  doc.fontSize(10).fillColor('#444444');
  doc.text(`Property: ${invoiceData.property_name}`, 320, 145);
  doc.text(`PAN: ${invoiceData.tenant_pan || 'N/A'}`, 320, 160);
  if (invoiceData.tenant_gstin) {
    doc.text(`GSTIN: ${invoiceData.tenant_gstin}`, 320, 175);
  }

  doc.moveDown(3);

  // Line items
  const tableTop = 220;
  doc.rect(50, tableTop, 500, 25).fill(headerColor);
  doc.fillColor('#ffffff').fontSize(10).text('Description', 60, tableTop + 7);
  doc.text('Amount (INR)', 440, tableTop + 7, { align: 'right', width: 100 });

  let rowTop = tableTop + 35;
  doc.fillColor('#000000');
  doc.text('Base Rent', 60, rowTop);
  doc.text(Number(invoiceData.rent_amount).toFixed(2), 440, rowTop, { align: 'right', width: 100 });

  if (Number(invoiceData.additional_charges) > 0) {
    rowTop += 20;
    doc.text('Additional Recurring Charges', 60, rowTop);
    doc.text(Number(invoiceData.additional_charges).toFixed(2), 440, rowTop, { align: 'right', width: 100 });
  }

  if (Number(invoiceData.gst_amount) > 0) {
    rowTop += 20;
    doc.text('GST (Goods and Services Tax)', 60, rowTop);
    doc.text(Number(invoiceData.gst_amount).toFixed(2), 440, rowTop, { align: 'right', width: 100 });
  }

  rowTop += 30;
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, rowTop).lineTo(550, rowTop).stroke();

  rowTop += 10;
  doc.fontSize(12).fillColor('#000000').text('Total Payable:', 320, rowTop);
  doc.text(`INR ${Number(invoiceData.total_amount).toFixed(2)}`, 440, rowTop, { align: 'right', width: 100 });

  // Footer notes
  if (invoiceData.footer_text) {
    doc.fontSize(9).fillColor('#777777').text(invoiceData.footer_text, 50, 680, { width: 500, align: 'center' });
  }

  doc.end();
};
