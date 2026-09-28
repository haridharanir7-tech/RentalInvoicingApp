const dbAdapter = require('./src/config/dbAdapter');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    const user = await dbAdapter.getUserByEmail('test@example.com'); // Or any email
    console.log('User:', user ? user.email : 'not found');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
