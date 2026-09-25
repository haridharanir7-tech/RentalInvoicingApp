const fs = require('fs');

const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/haridharani/genarateInvoices.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the Edit button with an empty string
const editButtonRegex = /<button title="Edit" onClick=\{\(\) => handleEditPreview\(item\)\} style=\{\{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: '0\.8rem', fontWeight: 600, cursor: 'pointer' \}\}\><Edit size=\{14\} \/> Edit<\/button>\s*/;

content = content.replace(editButtonRegex, '');

fs.writeFileSync(file, content);
console.log('Removed edit button from genarateInvoices.jsx');

