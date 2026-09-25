const db = require('../../config/database');

exports.getOccupancyReport = async (req, res) => {
    try {
        const { page = 1, limit = 5, search = '', status = '', landlord_id } = req.query;
        const offset = (page - 1) * limit;

        let queryParams = [];
        let whereClauses = [];

        if (search) {
            whereClauses.push(`(property_name ILIKE $${queryParams.length + 1} OR landlord_name ILIKE $${queryParams.length + 1} OR tenant_name ILIKE $${queryParams.length + 1})`);
            queryParams.push(`%${search}%`);
        }

        if (status) {
            whereClauses.push(`occupancy_status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        if (landlord_id) {
            whereClauses.push(`landlord_id = $${queryParams.length + 1}`);
            queryParams.push(parseInt(landlord_id, 10));
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const query = `
            WITH OccupancyData AS (
                SELECT 
                    p.id AS property_id,
                    p.name AS property_name,
                    p.property_type,
                    p.landlord_id,
                    l.name AS landlord_name,
                    t.id AS tenant_id,
                    t.name AS tenant_name,
                    t.status AS tenant_status,
                    t.lease_start_date,
                    t.lease_end_date,
                    CASE 
                        WHEN t.id IS NULL OR t.status = 'Vacated' THEN 'Vacant'
                        WHEN t.status = 'Notice Period' THEN 'Notice Period'
                        ELSE 'Occupied'
                    END as occupancy_status
                FROM properties p
                LEFT JOIN landlords l ON p.landlord_id = l.id
                LEFT JOIN tenants t ON t.property_id = p.id AND t.status != 'Vacated'
            )
            SELECT *, COUNT(*) OVER() as total_count 
            FROM OccupancyData
            ${whereString}
            ORDER BY property_name ASC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2};
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
