const fs = require('fs');

const editStyle = `display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'`;
const deleteStyle = `display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'`;

const fixIcons = (path) => {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Replace Edit button
  content = content.replace(
    /<button\s*title="Edit[^"]*"\s*style=\{\{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6'[, ]*(marginLeft: '10px', marginRight: '10px')? \}\}\s*>\s*<Edit size=\{1[468]\} \/>\s*<\/button>/g,
    `<button title="Edit" style={{ ${editStyle} }}><Edit size={14} /> Edit</button>`
  );

  // Replace Delete button
  content = content.replace(
    /<button\s*title="Delete[^"]*"\s*style=\{\{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' \}\}\s*>\s*<Trash2 size=\{1[468]\} \/>\s*<\/button>/g,
    `<button title="Delete" style={{ ${deleteStyle} }}><Trash2 size={14} /> Delete</button>`
  );

  // For AdminLandlords where style is width 30 height 30
  content = content.replace(
    /<button\s*title="Edit[^"]*"\s*style=\{\{ display: 'inline-flex'[^}]*color: '#3b82f6', cursor: 'pointer' \}\}\s*>\s*<Edit size=\{1[468]\} \/>\s*<\/button>/g,
    `<button title="Edit" style={{ ${editStyle} }}><Edit size={14} /> Edit</button>`
  );

  content = content.replace(
    /<button\s*title="Delete[^"]*"\s*style=\{\{ display: 'inline-flex'[^}]*color: '#ef4444', cursor: 'pointer' \}\}\s*>\s*<Trash2 size=\{1[468]\} \/>\s*<\/button>/g,
    `<button title="Delete" style={{ ${deleteStyle} }}><Trash2 size={14} /> Delete</button>`
  );
  
  fs.writeFileSync(path, content);
};

const files = [
  'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/haridharani/RentalRates.jsx',
  'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/haridharani/genarateInvoices.jsx',
  'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx'
];

files.forEach(fixIcons);
console.log('done');

