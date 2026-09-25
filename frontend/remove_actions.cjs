const fs = require('fs');

const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx';
let content = fs.readFileSync(file, 'utf8');

// Remove Activate and Deactivate buttons
content = content.replace(
  /\{\/\* Pending -> Grant Access \/ Approve \*\/\}[\s\S]*?\{\/\* Inactive -> Activate \*\/\}[\s\S]*?<\/button>\s*\)\}/,
  ''
);

fs.writeFileSync(file, content);
console.log('Removed Activate/Deactivate from AdminLandlords table');

