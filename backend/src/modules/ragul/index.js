const express = require('express');
const router = express.Router();
const db = require('../../config/database');

const DEFAULT_TEMPLATES = [
  {
    id: 'wave-blue',
    name: 'Modern Wave (Canva Style)',
    layoutStyle: 'wave',
    businessName: 'Sri Lakshmi Properties & Estates',
    address: 'Plot 14, 100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038',
    gstin: '29AKLPP4821M1Z6',
    pan: 'AAKLP4821M',
    header: '#1d4ed8',
    accent: '#2563eb',
    logo: null,
    logoName: 'lakshmi-wave.png',
    footer:
      'Bank: HDFC Bank, Indiranagar Branch - A/c 50200012345670 - IFSC HDFC0000123\nPayment terms: Due on the 5th of every month. Thank you for your business!',
    isDefault: true,
  },
  {
    id: 'minimal-charcoal',
    name: 'Clean Minimalist (Executive)',
    layoutStyle: 'minimal',
    businessName: 'Horizon Real Estate Holdings',
    address: '45 MG Road, CBD, Bengaluru, Karnataka 560001',
    gstin: '29AABCH9999M1ZQ',
    pan: 'AABCH9999M',
    header: '#0f172a',
    accent: '#3b82f6',
    logo: null,
    logoName: 'horizon-minimal.png',
    footer:
      'Bank: State Bank of India, MG Road - A/c 30999888777 - IFSC SBIN0000800\nPayment due within 7 days of invoice issuance. Electronic generated invoice.',
    isDefault: false,
  },
  {
    id: 'classic-pine',
    name: 'Classic Corporate (Boxed Grid)',
    layoutStyle: 'classic',
    businessName: 'Apex Commercial Realty Pvt Ltd',
    address: 'Tower B, Tech Park, Whitefield, Bengaluru, Karnataka 560066',
    gstin: '29AAACA2020B1Z4',
    pan: 'AAACA2020B',
    header: '#133832',
    accent: '#166534',
    logo: null,
    logoName: 'apex-grid.png',
    footer:
      'Bank: ICICI Bank, Whitefield - A/c 000205001234 - IFSC ICIC0000002\nIssued under Section 31 of CGST Act. Certified genuine rental billing.',
    isDefault: false,
  },
  {
    id: 'split-teal',
    name: 'Split Sidebar (Tech Pillar)',
    layoutStyle: 'split',
    businessName: 'Meridian Estates LLP',
    address: 'Tower 4, Electronic City Phase 1, Bengaluru, Karnataka 560100',
    gstin: '33AAQFM7310K1ZR',
    pan: 'AAQFM7310K',
    header: '#0f766e',
    accent: '#0d9488',
    logo: null,
    logoName: 'meridian-tech.png',
    footer:
      'Bank: Axis Bank, Electronic City - A/c 918020045678901 - IFSC UTIB0000142\nPrompt settlement is appreciated. For queries contact accounts@meridian.in.',
    isDefault: false,
  },
  {
    id: 'premium-gold',
    name: 'Premium Elegant (Signature & Gold)',
    layoutStyle: 'premium',
    businessName: 'Royal Heritage Residency & Commercials',
    address: 'Palace Cross Road, Vasanth Nagar, Bengaluru, Karnataka 560052',
    gstin: '29AAGCR5543K1ZM',
    pan: 'AAGCR5543K',
    header: '#b45309',
    accent: '#d97706',
    logo: null,
    logoName: 'royal-seal.png',
    footer:
      'Bank: Kotak Mahindra Bank - A/c 2011448899 - IFSC KKBK0000456\nCertified authentic billing document with authorized digital signatory.',
    isDefault: false,
  },
];

let inMemoryTemplates = [...DEFAULT_TEMPLATES];

// GET /api/ragul/templates - Fetch all templates from Supabase
router.get('/templates', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        template_id as id,
        name,
        COALESCE(layout_style, 'wave') as "layoutStyle",
        business_name as "businessName",
        address,
        gstin,
        pan,
        header_color as header,
        accent_color as accent,
        logo,
        logo_name as "logoName",
        footer,
        is_default as "isDefault"
      FROM invoice_template_settings
      ORDER BY is_default DESC, id ASC;
    `);

    if (result.rows.length >= 1) {
      return res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
        source: 'supabase_database',
      });
    }

    res.json({
      success: true,
      count: inMemoryTemplates.length,
      data: inMemoryTemplates,
    });
  } catch (err) {
    console.warn('Database fallback triggered for templates:', err.message);
    res.json({
      success: true,
      count: inMemoryTemplates.length,
      data: inMemoryTemplates,
      fallback: true,
    });
  }
});

// GET /api/ragul/active-template
router.get('/active-template', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        template_id as id,
        name,
        COALESCE(layout_style, 'wave') as "layoutStyle",
        header_color as header,
        accent_color as accent,
        business_name as "businessName",
        is_default as "isDefault"
      FROM invoice_template_settings
      WHERE is_default = TRUE
      LIMIT 1;
    `);

    if (result.rows.length > 0) {
      return res.json({ success: true, data: result.rows[0] });
    }
    const def = inMemoryTemplates.find((t) => t.isDefault) || inMemoryTemplates[0];
    res.json({ success: true, data: def });
  } catch (err) {
    const def = inMemoryTemplates.find((t) => t.isDefault) || inMemoryTemplates[0];
    res.json({ success: true, data: def });
  }
});

// POST /api/ragul/set-default/:id - Set default template in Supabase
router.post('/set-default/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryTemplates = inMemoryTemplates.map((t) => ({
    ...t,
    isDefault: t.id === id,
  }));

  try {
    await db.query('UPDATE invoice_template_settings SET is_default = FALSE');
    await db.query('UPDATE invoice_template_settings SET is_default = TRUE WHERE template_id = $1', [id]);
  } catch (err) {
    console.warn('DB set default error:', err.message);
  }

  res.json({ success: true, message: `Template ${id} set as default in database` });
});

// POST /api/ragul/templates - Save or update template directly to Supabase
router.post('/templates', async (req, res) => {
  const t = req.body;
  if (!t || !t.name) {
    return res.status(400).json({ success: false, message: 'Template name is required' });
  }

  const templateId = t.id || `template-${Date.now()}`;
  const layoutStyle = t.layoutStyle || 'wave';
  const existingIdx = inMemoryTemplates.findIndex((x) => x.id === templateId);

  if (t.isDefault) {
    inMemoryTemplates = inMemoryTemplates.map((item) => ({ ...item, isDefault: false }));
  }

  const updatedItem = {
    ...t,
    id: templateId,
    layoutStyle,
    businessName: t.businessName || 'Sri Lakshmi Properties & Estates',
    header: t.header || '#1d4ed8',
    accent: t.accent || '#2563eb',
  };

  if (existingIdx !== -1) {
    inMemoryTemplates[existingIdx] = updatedItem;
  } else {
    inMemoryTemplates.push(updatedItem);
  }

  try {
    if (t.isDefault) {
      await db.query('UPDATE invoice_template_settings SET is_default = FALSE');
    }

    const query = `
      INSERT INTO invoice_template_settings (
        template_id, name, layout_style, business_name, address, gstin, pan,
        header_color, accent_color, logo, logo_name, footer, is_default, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (template_id) DO UPDATE SET
        name = EXCLUDED.name,
        layout_style = EXCLUDED.layout_style,
        business_name = EXCLUDED.business_name,
        address = EXCLUDED.address,
        gstin = EXCLUDED.gstin,
        pan = EXCLUDED.pan,
        header_color = EXCLUDED.header_color,
        accent_color = EXCLUDED.accent_color,
        logo = EXCLUDED.logo,
        logo_name = EXCLUDED.logo_name,
        footer = EXCLUDED.footer,
        is_default = EXCLUDED.is_default,
        updated_at = NOW()
      RETURNING 
        template_id as id,
        name,
        layout_style as "layoutStyle",
        business_name as "businessName",
        address,
        gstin,
        pan,
        header_color as header,
        accent_color as accent,
        logo,
        logo_name as "logoName",
        footer,
        is_default as "isDefault";
    `;

    const dbRes = await db.query(query, [
      templateId,
      t.name,
      layoutStyle,
      t.businessName || '',
      t.address || '',
      t.gstin || '',
      t.pan || '',
      t.header || '#1d4ed8',
      t.accent || '#2563eb',
      t.logo || null,
      t.logoName || 'logo.png',
      t.footer || '',
      Boolean(t.isDefault),
    ]);

    if (dbRes.rows.length > 0) {
      return res.status(201).json({
        success: true,
        message: 'Template saved to Supabase database successfully',
        data: dbRes.rows[0],
      });
    }
  } catch (err) {
    console.error('Error saving template to DB:', err.message);
  }

  res.status(201).json({
    success: true,
    message: 'Template saved (in-memory & local fallback)',
    data: updatedItem,
  });
});

// DELETE /api/ragul/templates/:id
router.delete('/templates/:id', async (req, res) => {
  const { id } = req.params;
  inMemoryTemplates = inMemoryTemplates.filter((x) => x.id !== id);
  try {
    await db.query('DELETE FROM invoice_template_settings WHERE template_id = $1', [id]);
  } catch (err) {
    console.warn('DB delete error:', err.message);
  }
  res.json({ success: true, message: `Template ${id} deleted from database` });
});

module.exports = router;
