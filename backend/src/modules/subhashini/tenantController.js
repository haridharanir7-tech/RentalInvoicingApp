const db = require('../../config/database');

exports.createTenant = async (req, res) => {
    try {
        const { property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Tenant name is required' });
        }
        if (!property_id) {
            return res.status(400).json({ error: 'Property is required' });
        }

        const startDate = lease_start_date && lease_start_date.trim() !== '' ? lease_start_date : null;
        const endDate = lease_end_date && lease_end_date.trim() !== '' ? lease_end_date : null;

        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ error: 'Lease end date cannot be before lease start date.' });
        }

        const query = `
            INSERT INTO tenants (property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const values = [
            parseInt(property_id, 10), 
            name.trim(), 
            pan ? pan.trim().toUpperCase() : '', 
            gstin ? gstin.trim().toUpperCase() : '', 
            contact_details || '', 
            startDate, 
            endDate, 
            status || 'Active'
        ];
        
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('createTenant error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateTenant = async (req, res) => {
    try {
        const { id } = req.params;
        const { property_id, name, pan, gstin, contact_details, lease_start_date, lease_end_date, status } = req.body;

        const startDate = lease_start_date && lease_start_date.trim() !== '' ? lease_start_date : null;
        const endDate = lease_end_date && lease_end_date.trim() !== '' ? lease_end_date : null;

        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ error: 'Lease end date cannot be before lease start date.' });
        }

        const query = `
            UPDATE tenants
            SET property_id = $1, name = $2, pan = $3, gstin = $4, contact_details = $5, 
                lease_start_date = $6, lease_end_date = $7, status = $8, updated_at = CURRENT_TIMESTAMP
            WHERE id = $9 RETURNING *;
        `;
        const values = [
            property_id ? parseInt(property_id, 10) : null, 
            name ? name.trim() : '', 
            pan ? pan.trim().toUpperCase() : '', 
            gstin ? gstin.trim().toUpperCase() : '', 
            contact_details || '', 
            startDate, 
            endDate, 
            status || 'Active', 
            id
        ];

        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tenant not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('updateTenant error:', error);
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
        const { page = 1, limit = 5, search = '', status = '', property_id, landlord_id } = req.query;
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

        if (property_id) {
            whereClauses.push(`t.property_id = $${queryParams.length + 1}`);
            queryParams.push(parseInt(property_id, 10));
        }

        if (landlord_id) {
            whereClauses.push(`p.landlord_id = $${queryParams.length + 1}`);
            queryParams.push(parseInt(landlord_id, 10));
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT t.*, p.name as property_name, p.landlord_id, COUNT(*) OVER() as total_count 
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
