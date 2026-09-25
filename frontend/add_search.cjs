const fs = require('fs');

const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx';
let content = fs.readFileSync(file, 'utf8');

// Insert Search button before Clear button
content = content.replace(
  /<button type="button" className="btn btn-secondary" onClick=\{\(\) => \{ setSearch\(''\);/,
  `<button type="submit" className="btn btn-secondary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setSearch('');`
);

fs.writeFileSync(file, content);
console.log('Added search button');

