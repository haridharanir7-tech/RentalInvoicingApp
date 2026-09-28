const http = require('http');
const fs = require('fs');


const data = JSON.stringify({
  landlord_id: '1',
  name: 'Test Prop',
  address: 'Address',
  property_type: 'Commercial',
  is_active: 'true'
});
// wait, I don't have form-data locally, I will just use fetch in node. Wait! Node 18+ has fetch!
async function run() {
  try {
    const formData = new FormData();
    formData.append('landlord_id', '1');
    formData.append('name', 'Test Prop');
    formData.append('address', 'Test Addr');
    formData.append('property_type', 'Commercial');
    formData.append('is_active', 'true');
    formData.append('property_document', new Blob(['hello world']), 'test.txt');
    
    const res = await fetch('http://localhost:5001/api/master-data/properties', {
      method: 'POST',
      body: formData
    });
    
    const text = await res.text();
    console.log('Status:', res.status, 'Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
