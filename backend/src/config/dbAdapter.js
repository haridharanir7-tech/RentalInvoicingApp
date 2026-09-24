const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

// Ensure backups directory exists
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// In-Memory / File-backed Fallback Store
const DATA_FILE = path.join(__dirname, '../../data-store.json');

let store = null;

function loadStore() {
  if (store) return store;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      store = JSON.parse(content);
    } else {
      store = { users: [], landlords: [], properties: [], tenants: [], invoices: [], audit_logs: [], data_backups: [] };
    }
  } catch (err) {
    store = { users: [], landlords: [], properties: [], tenants: [], invoices: [], audit_logs: [], data_backups: [] };
  }
  return store;
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save data-store.json:', err.message);
  }
}

// Check PostgreSQL / Supabase connection
let isPgAvailable = false;
let checkPromise = null;

async function checkPgConnection() {
  if (checkPromise) return checkPromise;
  checkPromise = (async () => {
    try {
      const res = await pool.query('SELECT 1');
      isPgAvailable = !!res;
      console.log('✓ Active connection to Supabase (PostgreSQL) pool established');
    } catch (err) {
      isPgAvailable = false;
      console.log('ℹ Running with local data store:', err.message);
    }
    return isPgAvailable;
  })();
  return checkPromise;
}

// Immediate check on module startup
checkPgConnection();

const dbAdapter = {
  isPg: () => isPgAvailable,
  checkConnection: checkPgConnection,

  // ==========================================
  // USERS
  // ==========================================
  getUsers: async () => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          SELECT 
            u.user_id AS id, 
            u.full_name, 
            u.email, 
            u.role, 
            u.landlord_id, 
            u.status, 
            u.last_login, 
            u.created_at,
            l.name AS landlord_name
          FROM users u
          LEFT JOIN landlords l ON l.id = u.landlord_id
          ORDER BY u.created_at DESC;
        `);
        return res.rows;
      } catch (err) {
        console.error('Supabase getUsers error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.users;
  },

  getUserByEmail: async (email) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          SELECT 
            u.user_id AS id, 
            u.full_name, 
            u.email, 
            u.password_hash, 
            u.role, 
            u.landlord_id, 
            u.status, 
            u.last_login, 
            u.reset_token, 
            u.reset_token_expiry,
            l.name AS landlord_name
          FROM users u
          LEFT JOIN landlords l ON l.id = u.landlord_id
          WHERE LOWER(u.email) = LOWER($1);
        `, [email]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('Supabase getUserByEmail error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById: async (id) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          SELECT 
            u.user_id AS id, 
            u.full_name, 
            u.email, 
            u.role, 
            u.landlord_id, 
            u.status, 
            u.last_login, 
            l.name AS landlord_name
          FROM users u
          LEFT JOIN landlords l ON l.id = u.landlord_id
          WHERE u.user_id::text = $1::text;
        `, [String(id)]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('Supabase getUserById error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.users.find(x => String(x.id) === String(id));
  },

  createUser: async (userData) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          INSERT INTO users (full_name, email, password_hash, role, landlord_id, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING user_id AS id, full_name, email, role, landlord_id, status, created_at;
        `, [
          userData.full_name,
          userData.email,
          userData.password_hash,
          userData.role || 'Landlord',
          userData.landlord_id ? parseInt(userData.landlord_id, 10) : null,
          userData.status || 'Active'
        ]);
        return res.rows[0];
      } catch (err) {
        console.error('Supabase createUser error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const newId = s.users.length ? Math.max(...s.users.map(u => typeof u.id === 'number' ? u.id : 0)) + 1 : 1;
    const newUser = {
      id: newId,
      full_name: userData.full_name,
      email: userData.email,
      password_hash: userData.password_hash,
      role: userData.role || 'Landlord',
      landlord_id: userData.landlord_id ? parseInt(userData.landlord_id, 10) : null,
      status: userData.status || 'Active',
      last_login: null,
      created_at: new Date().toISOString()
    };
    s.users.push(newUser);
    saveStore();
    return newUser;
  },

  updateUser: async (id, updateData) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const fields = [];
        const values = [];
        let idx = 1;
        for (const [key, val] of Object.entries(updateData)) {
          fields.push(`"${key}" = $${idx++}`);
          values.push(val);
        }
        values.push(String(id));
        const res = await pool.query(`
          UPDATE users
          SET ${fields.join(', ')}
          WHERE user_id::text = $${idx}
          RETURNING user_id AS id, full_name, email, role, landlord_id, status, last_login;
        `, values);
        return res.rows[0];
      } catch (err) {
        console.error('Supabase updateUser error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const targetIdx = s.users.findIndex(u => String(u.id) === String(id));
    if (targetIdx !== -1) {
      s.users[targetIdx] = { ...s.users[targetIdx], ...updateData };
      saveStore();
      return s.users[targetIdx];
    }
    return null;
  },

  // ==========================================
  // LANDLORDS
  // ==========================================
  getLandlords: async (status = null) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        let query = 'SELECT id, name, pan, gstin, gst_registered, is_active FROM landlords';
        if (status === 'Active') {
          query += ' WHERE is_active = true';
        }
        query += ' ORDER BY id ASC;';
        const res = await pool.query(query);
        return res.rows.map(r => ({
          ...r,
          status: r.is_active ? 'Active' : 'Inactive'
        }));
      } catch (err) {
        console.error('Supabase getLandlords error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.landlords;
  },

  getLandlordById: async (id) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          SELECT id, name, email, contact_details, pan, gstin, gst_registered, billing_address, default_invoice_template, is_active 
          FROM landlords 
          WHERE id = $1;
        `, [parseInt(id, 10)]);
        if (res.rows[0]) {
          return {
            ...res.rows[0],
            status: res.rows[0].is_active ? 'Active' : 'Inactive',
            phone: res.rows[0].contact_details || ''
          };
        }
      } catch (err) {
        console.error('Supabase getLandlordById error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.landlords.find(l => String(l.id) === String(id));
  },

  createLandlord: async (data) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          INSERT INTO landlords (name, pan, gstin, contact_details, email, is_active, gst_registered)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name, pan, gstin, contact_details, email, is_active, gst_registered;
        `, [
          data.name,
          data.pan || null,
          data.gstin || null,
          data.contact_details || null,
          data.email || null,
          data.is_active !== undefined ? data.is_active : false,
          data.gst_registered !== undefined ? data.gst_registered : false
        ]);
        return res.rows[0];
      } catch (err) {
        console.error('Supabase createLandlord error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const newId = s.landlords.length ? Math.max(...s.landlords.map(l => l.id || 0)) + 1 : 1;
    const newLandlord = {
      id: newId,
      name: data.name,
      pan: data.pan || '',
      gstin: data.gstin || '',
      contact_details: data.contact_details || '',
      email: data.email || '',
      is_active: data.is_active !== undefined ? data.is_active : false,
      gst_registered: data.gst_registered !== undefined ? data.gst_registered : false,
      status: data.is_active ? 'Active' : 'Pending'
    };
    s.landlords.push(newLandlord);
    saveStore();
    return newLandlord;
  },

  getAdminLandlords: async () => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const sql = `
          SELECT 
            l.id,
            l.name,
            l.pan,
            l.gstin,
            l.contact_details,
            l.email AS landlord_email,
            l.is_active,
            l.created_at,
            COALESCE(
              MAX(CASE WHEN UPPER(u.status) = 'PENDING' THEN 'PENDING' END),
              MAX(CASE WHEN UPPER(u.status) = 'ACTIVE' THEN 'ACTIVE' END),
              MAX(CASE WHEN UPPER(u.status) = 'INACTIVE' THEN 'INACTIVE' END),
              CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END
            ) AS status,
            COALESCE(MAX(u.email), l.email) AS email,
            MAX(u.full_name) AS user_name,
            MAX(u.user_id::text) AS user_id,
            COUNT(DISTINCT p.id) AS property_count
          FROM landlords l
          LEFT JOIN users u ON u.landlord_id = l.id
          LEFT JOIN properties p ON p.landlord_id = l.id
          GROUP BY l.id, l.name, l.pan, l.gstin, l.contact_details, l.email, l.is_active, l.created_at
          ORDER BY 
            CASE WHEN COALESCE(MAX(CASE WHEN UPPER(u.status) = 'PENDING' THEN 'PENDING' END), '') = 'PENDING' THEN 1 ELSE 2 END,
            l.id DESC;
        `;
        const res = await pool.query(sql);
        return res.rows;
      } catch (err) {
        console.error('Supabase getAdminLandlords error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.landlords.map(l => {
      const linkedUser = s.users.find(u => u.landlord_id === l.id);
      const propCount = s.properties.filter(p => p.landlord_id === l.id).length;
      return {
        id: l.id,
        name: l.name,
        pan: l.pan,
        gstin: l.gstin,
        contact_details: l.contact_details,
        landlord_email: l.email,
        is_active: l.is_active,
        created_at: l.created_at || new Date().toISOString(),
        status: linkedUser ? linkedUser.status.toUpperCase() : (l.is_active ? 'ACTIVE' : 'INACTIVE'),
        email: linkedUser ? linkedUser.email : l.email,
        user_name: linkedUser ? linkedUser.full_name : null,
        user_id: linkedUser ? linkedUser.id : null,
        property_count: propCount
      };
    });
  },

  updateLandlordStatus: async (landlordId, status) => {
    await checkPgConnection();
    const isActive = status.toUpperCase() === 'ACTIVE';
    if (isPgAvailable) {
      try {
        await pool.query('UPDATE landlords SET is_active = $1 WHERE id = $2;', [isActive, parseInt(landlordId, 10)]);
        await pool.query('UPDATE users SET status = $1 WHERE landlord_id = $2;', [status.toUpperCase(), parseInt(landlordId, 10)]);
        return { success: true, landlord_id: landlordId, status: status.toUpperCase(), is_active: isActive };
      } catch (err) {
        console.error('Supabase updateLandlordStatus error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const l = s.landlords.find(x => String(x.id) === String(landlordId));
    if (l) {
      l.is_active = isActive;
      l.status = status;
    }
    const u = s.users.find(x => String(x.landlord_id) === String(landlordId));
    if (u) {
      u.status = status;
    }
    saveStore();
    return { success: true, landlord_id: landlordId, status: status.toUpperCase(), is_active: isActive };
  },

  // ==========================================
  // PROPERTIES
  // ==========================================
  getProperties: async (landlordId = null) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        let query = `
          SELECT 
            p.id, 
            p.name AS property_name, 
            p.address, 
            p.property_type, 
            p.total_area AS area_sqft, 
            p.landlord_id, 
            l.name AS landlord_name,
            p.is_active
          FROM properties p
          LEFT JOIN landlords l ON l.id = p.landlord_id
        `;
        const params = [];
        if (landlordId) {
          query += ' WHERE p.landlord_id = $1';
          params.push(parseInt(landlordId, 10));
        }
        query += ' ORDER BY p.id ASC;';
        const res = await pool.query(query, params);
        return res.rows.map(r => ({ ...r, status: r.is_active ? 'Active' : 'Inactive' }));
      } catch (err) {
        console.error('Supabase getProperties error, falling back:', err.message);
      }
    }
    const s = loadStore();
    let list = s.properties;
    if (landlordId) list = list.filter(p => p.landlord_id === parseInt(landlordId, 10));
    return list;
  },

  // ==========================================
  // TENANTS
  // ==========================================
  getTenants: async (landlordId = null) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        let query = `
          SELECT 
            t.id, 
            t.name AS tenant_name, 
            t.pan, 
            t.gstin, 
            t.property_id, 
            p.name AS property_name, 
            p.landlord_id, 
            l.name AS landlord_name, 
            t.status
          FROM tenants t
          LEFT JOIN properties p ON p.id = t.property_id
          LEFT JOIN landlords l ON l.id = p.landlord_id
        `;
        const params = [];
        if (landlordId) {
          query += ' WHERE p.landlord_id = $1';
          params.push(parseInt(landlordId, 10));
        }
        query += ' ORDER BY t.id ASC;';
        const res = await pool.query(query, params);
        return res.rows;
      } catch (err) {
        console.error('Supabase getTenants error, falling back:', err.message);
      }
    }
    const s = loadStore();
    let list = s.tenants;
    if (landlordId) list = list.filter(t => t.landlord_id === parseInt(landlordId, 10));
    return list;
  },

  // ==========================================
  // INVOICES
  // ==========================================
  getInvoices: async ({ landlordId, billingPeriod, status } = {}) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        let query = `
          SELECT 
            i.invoice_id AS id, 
            i.invoice_number, 
            TO_CHAR(i.invoice_date, 'YYYY-MM-DD') AS invoice_date, 
            i.billing_period, 
            i.landlord_id, 
            i.property_id, 
            i.tenant_id, 
            COALESCE(i.rent_amount, 0) AS rent_amount, 
            COALESCE(i.additional_charges, i.addinational_charges, 0) AS additional_charges, 
            COALESCE(i.gst_amount, 0) AS gst_amount, 
            COALESCE(i.total_amount, 0) AS total_amount, 
            i.status, 
            l.name AS landlord_name, 
            p.name AS property_name, 
            t.name AS tenant_name
          FROM invoices i
          LEFT JOIN landlords l ON l.id = i.landlord_id
          LEFT JOIN properties p ON p.id = i.property_id
          LEFT JOIN tenants t ON t.id = i.tenant_id
          WHERE 1=1
        `;
        const params = [];
        let idx = 1;
        if (landlordId) {
          query += ` AND i.landlord_id = $${idx++}`;
          params.push(parseInt(landlordId, 10));
        }
        if (billingPeriod) {
          query += ` AND i.billing_period = $${idx++}`;
          params.push(billingPeriod);
        }
        if (status) {
          query += ` AND LOWER(i.status) = LOWER($${idx++})`;
          params.push(status);
        }
        query += ' ORDER BY i.invoice_id DESC;';
        const res = await pool.query(query, params);
        return res.rows;
      } catch (err) {
        console.error('Supabase getInvoices error, falling back:', err.message);
      }
    }
    const s = loadStore();
    let list = s.invoices;
    if (landlordId) list = list.filter(inv => inv.landlord_id === parseInt(landlordId, 10));
    if (billingPeriod) list = list.filter(inv => inv.billing_period === billingPeriod);
    if (status) list = list.filter(inv => inv.status.toLowerCase() === status.toLowerCase());
    return list;
  },

  getInvoiceById: async (id) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          SELECT 
            invoice_id AS id, 
            invoice_number, 
            TO_CHAR(invoice_date, 'YYYY-MM-DD') AS invoice_date, 
            billing_period, 
            landlord_id, 
            rent_amount, 
            COALESCE(additional_charges, addinational_charges, 0) AS additional_charges, 
            gst_amount, 
            total_amount, 
            status
          FROM invoices
          WHERE invoice_id::text = $1::text OR invoice_number = $1::text;
        `, [String(id)]);
        return res.rows[0] || null;
      } catch (err) {
        console.error('Supabase getInvoiceById error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.invoices.find(inv => String(inv.id) === String(id) || inv.invoice_number === id);
  },

  updateInvoice: async (id, data) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const fields = [];
        const params = [];
        let idx = 1;
        if (data.additional_charges !== undefined) {
          fields.push(`additional_charges = $${idx++}`);
          params.push(data.additional_charges);
        }
        if (data.total_amount !== undefined) {
          fields.push(`total_amount = $${idx++}`);
          params.push(data.total_amount);
        }
        if (data.status !== undefined) {
          fields.push(`status = $${idx++}`);
          params.push(data.status);
        }
        params.push(String(id));
        const res = await pool.query(`
          UPDATE invoices
          SET ${fields.join(', ')}
          WHERE invoice_id::text = $${idx} OR invoice_number = $${idx}
          RETURNING invoice_id AS id, invoice_number, additional_charges, total_amount, status;
        `, params);
        return { current: res.rows[0] };
      } catch (err) {
        console.error('Supabase updateInvoice error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const idx = s.invoices.findIndex(inv => String(inv.id) === String(id) || inv.invoice_number === id);
    if (idx !== -1) {
      s.invoices[idx] = { ...s.invoices[idx], ...data };
      saveStore();
      return { current: s.invoices[idx] };
    }
    return null;
  },

  // ==========================================
  // AUDIT LOGS
  // ==========================================
  getAuditLogs: async ({ entityType, startDate, endDate } = {}) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        let query = 'SELECT log_id AS id, entity_type, entity_id, action, old_values, new_values, reason, performed_by_name, created_at FROM audit_logs WHERE 1=1';
        const params = [];
        let idx = 1;
        if (entityType) {
          query += ` AND UPPER(entity_type) = UPPER($${idx++})`;
          params.push(entityType);
        }
        query += ' ORDER BY created_at DESC;';
        const res = await pool.query(query, params);
        return res.rows;
      } catch (err) {
        console.error('Supabase getAuditLogs error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.audit_logs;
  },

  createAuditLog: async (logData) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, reason, performed_by_name, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING log_id AS id, entity_type, entity_id, action, reason, performed_by_name, created_at;
        `, [
          logData.entity_type,
          String(logData.entity_id),
          logData.action,
          JSON.stringify(logData.old_values || null),
          JSON.stringify(logData.new_values || null),
          logData.reason || null,
          logData.performed_by_name || 'System'
        ]);
        return res.rows[0];
      } catch (err) {
        console.error('Supabase createAuditLog error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const newLog = {
      id: s.audit_logs.length + 1,
      ...logData,
      created_at: new Date().toISOString()
    };
    s.audit_logs.unshift(newLog);
    saveStore();
    return newLog;
  },

  // ==========================================
  // BACKUPS
  // ==========================================
  getBackups: async () => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query('SELECT * FROM data_backups ORDER BY created_at DESC;');
        return res.rows;
      } catch (err) {
        console.error('Supabase getBackups error, falling back:', err.message);
      }
    }
    const s = loadStore();
    return s.data_backups;
  },

  createBackupRecord: async (backupData) => {
    await checkPgConnection();
    if (isPgAvailable) {
      try {
        const res = await pool.query(`
          INSERT INTO data_backups (backup_name, backup_type, file_path, file_size_bytes, record_counts, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *;
        `, [
          backupData.backup_name,
          backupData.backup_type || 'Full',
          backupData.file_path,
          backupData.file_size_bytes || 0,
          JSON.stringify(backupData.record_counts || {}),
          backupData.status || 'Completed'
        ]);
        return res.rows[0];
      } catch (err) {
        console.error('Supabase createBackupRecord error, falling back:', err.message);
      }
    }
    const s = loadStore();
    const rec = { id: s.data_backups.length + 1, ...backupData, created_at: new Date().toISOString() };
    s.data_backups.unshift(rec);
    saveStore();
    return rec;
  },

  exportFullSnapshot: () => {
    const s = loadStore();
    return JSON.parse(JSON.stringify(s));
  }
};

module.exports = dbAdapter;
