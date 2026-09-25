const fs = require('fs');

const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx';
let content = fs.readFileSync(file, 'utf8');

const buttonsHtml = `
                            {/* Edit */}
                            <button title="Edit" onClick={() => {
                                setAddFormData({
                                  id: l.id,
                                  name: l.name || '',
                                  email: l.email || l.landlord_email || '',
                                  pan: l.pan || '',
                                  gstin: l.gstin || '',
                                  contact_details: l.contact_details || '',
                                  billing_address: l.billing_address || '',
                                  gst_registered: !!l.gst_registered,
                                  default_invoice_template: l.default_invoice_template || 'Template A (Standard)',
                                  is_active: (l.status || '').toUpperCase() === 'ACTIVE'
                                });
                                setAddModalOpen(true);
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}><Edit size={13} /> Edit</button>

                            {/* Delete */}
                            <button title="Delete" onClick={async () => {
                              if(window.confirm('Are you sure you want to delete this landlord?')) {
                                try {
                                  await fetch('/api/master-data/landlords/' + l.id, { method: 'DELETE' });
                                  fetchLandlords();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}><Trash2 size={13} /> Delete</button>
`;

content = content.replace(
  /<KeyRound size=\{13\} \/>[\s\n]*Credentials[\s\n]*<\/button>/,
  (match) => {
    return match + '\n' + buttonsHtml;
  }
);

fs.writeFileSync(file, content);
console.log('Restored Edit and Delete buttons');

