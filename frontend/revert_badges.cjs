const fs = require('fs');

function revertProperty() {
  const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/subhashini/PropertyManagement.jsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /<select[\s\S]*?value=\{p\.is_active \? 'Active' : 'Inactive'\}[\s\S]*?onChange=\{\(\) => handleToggleStatus\(p\.id\)\}[\s\S]*?className=\{p\.is_active \? 'badge badge-active' : 'badge badge-inactive'\}[\s\S]*?style=\{\{ cursor: 'pointer', outline: 'none' \}\}[\s\S]*?>[\s\S]*?<option value="Active">Active<\/option>[\s\S]*?<option value="Inactive">Inactive<\/option>[\s\S]*?<\/select>/,
    `<span className={p.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                      {p.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>`
  );
  fs.writeFileSync(file, content);
}

function revertLandlord() {
  const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/subhashini/LandlordManagement.jsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /<select[\s\S]*?value=\{l\.is_active \? 'Active' : 'Inactive'\}[\s\S]*?onChange=\{\(\) => handleToggleStatus\(l\.id\)\}[\s\S]*?className=\{l\.is_active \? 'badge badge-active' : 'badge badge-inactive'\}[\s\S]*?style=\{\{ cursor: 'pointer', outline: 'none' \}\}[\s\S]*?>[\s\S]*?<option value="Active">Active<\/option>[\s\S]*?<option value="Inactive">Inactive<\/option>[\s\S]*?<\/select>/,
    `<span className={l.is_active ? 'badge badge-active' : 'badge badge-inactive'}>
                      {l.is_active ? <CheckCircle size={13} /> : <XCircle size={13} />}
                      {l.is_active ? 'Active' : 'Inactive'}
                    </span>`
  );
  fs.writeFileSync(file, content);
}

function revertAdminLandlords() {
  const file = 'c:/Users/ragul/OneDrive/Desktop/Rental-Invoice/frontend/src/modules/priya/pages/AdminLandlords.jsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    /<select[\s\S]*?value=\{l\.status \|\| 'INACTIVE'\}[\s\S]*?onChange=\{\(e\) => handleStatusChange\(l\.id, e\.target\.value\)\}[\s\S]*?style=\{\{[\s\S]*?appearance: 'auto'[\s\S]*?\}\}[\s\S]*?>[\s\S]*?<option value="ACTIVE">Active<\/option>[\s\S]*?<option value="INACTIVE">Inactive<\/option>[\s\S]*?<option value="PENDING">Pending<\/option>[\s\S]*?<\/select>/,
    `<span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: isPending ? '#fef3c7' : isActive ? '#dcfce7' : '#fee2e2',
                            color: isPending ? '#b45309' : isActive ? '#15803d' : '#991b1b'
                          }}>
                            {isPending && <Clock size={12} />}
                            {isActive && <CheckCircle size={12} />}
                            {isInactive && <XCircle size={12} />}
                            {l.status || 'INACTIVE'}
                          </span>`
  );
  fs.writeFileSync(file, content);
}

revertProperty();
revertLandlord();
revertAdminLandlords();
console.log('Reverted to static badges');

