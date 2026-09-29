import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { createRoot } from 'react-dom/client';
import InvoiceTemplateRenderer from './InvoiceTemplateRenderer';

export const generateInvoicePdf = async (invoice, template) => {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '800px'; 
      container.style.background = '#ffffff';
      document.body.appendChild(container);

      const root = createRoot(container);
      root.render(React.createElement(InvoiceTemplateRenderer, { invoice, template }));

      setTimeout(async () => {
        try {
          const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

          const sanitizedInvNum = (invoice.invoice_number || 'INVOICE').replace(/[^a-zA-Z0-9_-]/g, '');
          const sanitizedLandlord = (invoice.landlord_name || 'Landlord').replace(/[^a-zA-Z0-9_-]/g, '');
          const filename = `Invoice_${sanitizedInvNum}_${sanitizedLandlord}.pdf`;
          
          pdf.save(filename);
          root.unmount();
          document.body.removeChild(container);
          resolve({ success: true, filename });
        } catch (err) {
          document.body.removeChild(container);
          reject(err);
        }
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
};

