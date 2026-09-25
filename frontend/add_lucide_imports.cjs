const fs = require('fs');

const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /Plus,[\s\n]*X[\s\n]*\} from 'lucide-react';/,
  `Plus,\n  X,\n  Edit,\n  Trash2\n} from 'lucide-react';`
);

fs.writeFileSync(file, content);
console.log('Added lucide imports');

