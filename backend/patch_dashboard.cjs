const fs = require('fs');
const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/backend/src/modules/priya/controllers/dashboardController.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /invoices: invoices\.slice\(0, 5\)/,
  `invoices: invoices.slice(0, 5),
          properties: properties.slice(0, 5),
          tenants: tenants.slice(0, 5)`
);

fs.writeFileSync(file, content);
console.log('done');

