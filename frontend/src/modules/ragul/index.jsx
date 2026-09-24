import React, { useState, useEffect } from 'react';
import InvoiceTemplatesView from './InvoiceTemplates';
import './InvoiceTemplates.css';

// 5 Selected Templates matching user requirements and Google image search
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

export default function RagulModule() {
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem('ragul_templates_5_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 5) return parsed;
      }
      return DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState('wave-blue');
  const [toastMessage, setToastMessage] = useState(null);

  function showMessage(msg) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }

  // Fetch templates from API or Supabase on mount
  useEffect(() => {
    fetch('/api/ragul/templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length >= 5) {
          setTemplates(data.data);
          const def = data.data.find((t) => t.isDefault);
          if (def) setSelectedTemplateId(def.id);
        }
      })
      .catch((err) => {
        console.warn('Using local templates:', err);
      });
  }, []);

  // Save to localStorage whenever templates change
  useEffect(() => {
    try {
      localStorage.setItem('ragul_templates_5_v2', JSON.stringify(templates));
    } catch (e) {
      console.error('Failed to save templates to localStorage', e);
    }
  }, [templates]);

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];

  // Save or update template
  function handleSave(templateData, isNew = false) {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === templateData.id);
      let updated;
      if (exists) {
        updated = prev.map((t) => {
          if (t.id === templateData.id) {
            return { ...templateData };
          }
          if (templateData.isDefault) {
            return { ...t, isDefault: false };
          }
          return t;
        });
      } else {
        const item = { ...templateData };
        if (item.isDefault) {
          updated = prev.map((t) => ({ ...t, isDefault: false })).concat(item);
        } else {
          updated = [...prev, item];
        }
      }
      return updated;
    });

    setSelectedTemplateId(templateData.id);

    // Sync to backend in background
    fetch('/api/ragul/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log('Template synced with backend');
        }
      })
      .catch((err) => console.warn('Backend sync warning:', err));
  }

  function handleSetDefault(id) {
    setTemplates((prev) =>
      prev.map((t) => ({
        ...t,
        isDefault: t.id === id,
      }))
    );
    const target = templates.find((t) => t.id === id);
    showMessage?.(`"${target?.name}" set as default.`);

    fetch(`/api/ragul/set-default/${id}`, { method: 'POST' }).catch((err) =>
      console.warn('Set default warning:', err)
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Toast alert */}
      {toastMessage && (
        <div className="mentor-toast-alert no-print">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Render 5-Template View */}
      <InvoiceTemplatesView
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        activeTemplate={activeTemplate}
        onSave={handleSave}
        onSetDefault={handleSetDefault}
        showMessage={showMessage}
      />
    </div>
  );
}
