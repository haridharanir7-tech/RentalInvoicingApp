const db = require('../../config/database');

exports.createLandlord = async (req, res) => {
    try {
        const { name, email, pan, gstin, contact_details, billing_address, is_active, gst_registered, default_invoice_template } = req.body;
        
        // Validation for GSTIN if gst_registered is true
        if (gst_registered && !gstin) {
            return res.status(400).json({ error: 'GSTIN is mandatory when GST Registered is true.' });
        }

        const query = `
            INSERT INTO landlords (name, email, pan, gstin, contact_details, billing_address, is_active, gst_registered, default_invoice_template)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
        `;
        const values = [name, email, pan, gstin, contact_details, billing_address, is_active !== false, gst_registered || false, default_invoice_template];
        
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateLandlord = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, pan, gstin, contact_details, billing_address, is_active, gst_registered, default_invoice_template } = req.body;

        if (gst_registered && !gstin) {
            return res.status(400).json({ error: 'GSTIN is mandatory when GST Registered is true.' });
        }

        const query = `
            UPDATE landlords
            SET name = $1, email = $2, pan = $3, gstin = $4, contact_details = $5, billing_address = $6, is_active = $7, gst_registered = $8, default_invoice_template = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 RETURNING *;
        `;
        const values = [name, email, pan, gstin, contact_details, billing_address, is_active, gst_registered, default_invoice_template, id];

        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deactivateLandlord = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `UPDATE landlords SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLandlords = async (req, res) => {
    try {
        const { page = 1, limit = 5, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let queryParams = [];
        let whereClauses = [];
        
        if (search) {
            whereClauses.push(`(name ILIKE $${queryParams.length + 1} OR pan ILIKE $${queryParams.length + 1} OR gstin ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }
        
        if (status === 'active') {
            whereClauses.push(`is_active = true`);
        } else if (status === 'inactive') {
            whereClauses.push(`is_active = false`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        const query = `
            SELECT *, COUNT(*) OVER() as total_count 
            FROM landlords 
            ${whereString}
            ORDER BY id DESC 
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(limit, offset);
        
        const result = await db.query(query, queryParams);
        
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const totalPages = Math.ceil(total / limit);
        
        // Remove total_count from each row for cleaner response
        const data = result.rows.map(row => {
            const { total_count, ...rest } = row;
            return rest;
        });

        res.json({
            data,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateLandlord = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, pan, gstin, contact_details, billing_address, is_active, gst_registered, default_invoice_template } = req.body;
        
        const query = `
            UPDATE landlords 
            SET name = $1, pan = $2, gstin = $3, contact_details = $4, 
                billing_address = $5, is_active = $6, gst_registered = $7, 
                default_invoice_template = $8, updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `;
        const values = [name, pan, gstin, contact_details, billing_address, is_active !== undefined ? is_active : true, gst_registered, default_invoice_template, id];
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found' });
        }
        
        res.json({ message: 'Landlord updated successfully', landlord: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteLandlord = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM landlords WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Landlord not found' });
        }
        
        res.json({ message: 'Landlord deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
