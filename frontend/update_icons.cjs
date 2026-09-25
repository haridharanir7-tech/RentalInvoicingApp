const fs = require('fs');

const updateIcons = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Change <Edit size={16} /> to <Edit size={18} />
  // Change <Trash2 size={16} /> to <Trash2 size={18} />
  content = content.replace(/<Edit size=\{16\} \/>/g, '<Edit size={18} />');
  content = content.replace(/<Trash2 size=\{16\} \/>/g, '<Trash2 size={18} />');
  content = content.replace(/<Edit size=\{14\} \/>/g, '<Edit size={18} />');
  content = content.replace(/<Trash2 size=\{14\} \/>/g, '<Trash2 size={18} />');
  
  // Add margin-right to Edit buttons and history buttons
  content = content.replace(
    /style=\{\{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' \}\}/g,
    "style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginLeft: '10px', marginRight: '10px' }}"
  );

  fs.writeFileSync(filePath, content);
};

const files = [
  'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/haridharani/RentalRates.jsx',
  'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/haridharani/genarateInvoices.jsx',
  'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx'
];

files.forEach(f => updateIcons(f));
console.log('done');

