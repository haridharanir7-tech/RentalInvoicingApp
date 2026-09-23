const db = require('../../config/database');

exports.createTenant = async (req, res) => {
    try {
        const { property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status } = req.body;

        if (lease_end_date && lease_start_date && new Date(lease_end_date) < new Date(lease_start_date)) {
            return res.status(400).json({ error: 'Lease end date cannot be before lease start date.' });
        }

        const query = `
            INSERT INTO tenants (property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const values = [property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status || 'Active'];
        
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status } = req.body;

        if (lease_end_date && lease_start_date && new Date(lease_end_date) < new Date(lease_start_date)) {
            return res.status(400).json({ error: 'Lease end date cannot be before lease start date.' });
        }

        const query = `
            UPDATE tenants
            SET property_id = $1, name = $2, pan = $3, gstin = $4, contact_details = $5, lease_start_date = $6, lease_end_date = $7, status = $8, updated_at = CURRENT_TIMESTAMP
            WHERE id = $9 RETURNING *;
        `;
        const values = [property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status, id];

        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deactivateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        // Marking as vacated when deactivated
        const query = `UPDATE tenants SET status = 'Vacated', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTenants = async (req, res) => {
    try {
        const { page = 1, limit = 5, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let queryParams = [];
        let whereClauses = [];
        
        if (search) {
            whereClauses.push(`(t.name ILIKE $${queryParams.length + 1} OR t.pan ILIKE $${queryParams.length + 1} OR t.gstin ILIKE $${queryParams.length + 1} OR p.name ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }
        
        if (status) {
            whereClauses.push(`t.status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT t.*, p.name as property_name, COUNT(*) OVER() as total_count 
            FROM tenants t
            LEFT JOIN properties p ON t.property_id = p.id
            ${whereString}
            ORDER BY t.id DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(limit, offset);

        const result = await db.query(query, queryParams);
        
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
        const totalPages = Math.ceil(total / limit);
        
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

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status } = req.body;
        
        const query = `
            UPDATE tenants 
            SET property_id = $1, name = $2, pan = $3, gstin = $4, 
                contact_details = $5, lease_start_date = $6, lease_end_date = $7, 
                status = $8, updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *
        `;
        const values = [
            property_id || null, name, pan, gstin, contact_details, 
            lease_start_date || null, lease_end_date || null, status || 'Active', id
        ];
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        res.json({ message: 'Tenant updated successfully', tenant: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM tenants WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        
        res.json({ message: 'Tenant deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
