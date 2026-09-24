const db = require('../../config/database');

exports.createProperty = async (req, res) => {
    try {
        const { landlord_id, name, address, property_type, total_area, is_active } = req.body;
        
        if (!landlord_id) {
            return res.status(400).json({ error: 'landlord_id is required to associate property' });
        }

        const query = `
            INSERT INTO properties (landlord_id, name, address, property_type, total_area, is_active)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const values = [landlord_id, name, address, property_type, total_area, is_active !== false];
        
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { landlord_id, name, address, property_type, total_area, is_active } = req.body;

        const query = `
            UPDATE properties
            SET landlord_id = $1, name = $2, address = $3, property_type = $4, total_area = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7 RETURNING *;
        `;
        const values = [landlord_id, name, address, property_type, total_area, is_active, id];

        const result = await db.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deactivateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `UPDATE properties SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getProperties = async (req, res) => {
    try {
        const { page = 1, limit = 5, search = '', status = '' } = req.query;
        const offset = (page - 1) * limit;
        
        let queryParams = [];
        let whereClauses = [];
        
        if (search) {
            whereClauses.push(`(p.name ILIKE $${queryParams.length + 1} OR p.address ILIKE $${queryParams.length + 1} OR l.name ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }
        
        if (status === 'active') {
            whereClauses.push(`p.is_active = true`);
        } else if (status === 'inactive') {
            whereClauses.push(`p.is_active = false`);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            SELECT p.*, l.name as landlord_name, COUNT(*) OVER() as total_count 
            FROM properties p
            LEFT JOIN landlords l ON p.landlord_id = l.id
            ${whereString}
            ORDER BY p.id DESC
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

exports.updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { landlord_id, name, address, property_type, total_area, is_active } = req.body;
        
        const query = `
            UPDATE properties 
            SET landlord_id = $1, name = $2, address = $3, property_type = $4, 
                total_area = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING *
        `;
        const values = [landlord_id || null, name, address, property_type, total_area || null, is_active !== undefined ? is_active : true, id];
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        res.json({ message: 'Property updated successfully', property: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM properties WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Property not found' });
        }
        
        res.json({ message: 'Property deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
