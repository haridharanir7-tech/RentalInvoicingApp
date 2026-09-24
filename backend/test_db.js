const db = require('./src/config/database');
Promise.all(['landlords', 'properties', 'tenants'].map(t => 
    db.query(`SELECT COUNT(*) FROM ${t}`)
    .then(r => console.log(t, r.rows[0].count))
)).then(() => process.exit(0));
