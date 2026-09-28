const { pool } = require('./src/config/database');

async function createTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS property_documents (
                id SERIAL PRIMARY KEY,
                property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
                document_name VARCHAR(255) NOT NULL,
                document_url VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table property_documents created successfully.');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        pool.end();
    }
}

createTable();
