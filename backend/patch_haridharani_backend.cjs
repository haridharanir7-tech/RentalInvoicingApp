const fs = require('fs');

// Patch backend routes
const routesFile = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/backend/src/modules/haridharani/routes.js';
let routesContent = fs.readFileSync(routesFile, 'utf8');
if (!routesContent.includes("deleteRentalRate")) {
  routesContent = routesContent.replace(
    /router\.post\('\/rental-rates', rentalRateController\.saveRentalRate\);/,
    `router.post('/rental-rates', rentalRateController.saveRentalRate);\nrouter.delete('/rental-rates/:id', rentalRateController.deleteRentalRate);`
  );
  fs.writeFileSync(routesFile, routesContent);
}

// Patch rentalRateController
const ctlFile = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/backend/src/modules/haridharani/rentalRateController.js';
let ctlContent = fs.readFileSync(ctlFile, 'utf8');
if (!ctlContent.includes("deleteRentalRate = ")) {
  const deleteFunc = `
exports.deleteRentalRate = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require('../../../config/dbAdapter').pool;
    if (!pool) return res.status(500).json({ success: false, error: 'Database unavailable' });
    await pool.query('DELETE FROM rental_rates WHERE id = $1', [parseInt(id, 10)]);
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
`;
  ctlContent += deleteFunc;
  
  // also allow edit logic in saveRentalRate if rate_id is passed
  ctlContent = ctlContent.replace(
    /const insertQuery = \`[\s\n]*INSERT INTO rental_rates/,
    `if (req.body.rate_id) {
          await pool.query(\`
            UPDATE rental_rates 
            SET landlord_id=$1, property_id=$2, tenant_id=$3, effective_from=$4, effective_to=$5, monthly_rent=$6, maintenance_charges=$7, parking_charges=$8, tax_supply_type=$9, gst_applicable=$10, gst_rate=$11, change_reason=$12
            WHERE id=$13
          \`, [
            landlord_id, property_id, tenant_id, effective_from || null, effective_to || null,
            monthly_rent || 0, maintenance_charges || 0, parking_charges || 0,
            tax_supply_type || 'intra_state', !!gst_applicable, gst_rate || 0, change_reason || '', req.body.rate_id
          ]);
          return res.status(201).json({ success: true, message: 'Rate updated successfully' });
        }
        $&`
  );
  
  fs.writeFileSync(ctlFile, ctlContent);
}
console.log('Backend patched.');

