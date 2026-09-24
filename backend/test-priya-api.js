const http = require('http');
require('dotenv').config({ path: './.env' });
const app = require('./src/app');

let server;
let adminToken = '';
let landlordToken = '';
const PORT = 5055;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/priya${path}`,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Priya Module Automated API Tests against LIVE Supabase...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Admin Login
  console.log('[1] Testing Admin Login...');
  const resAdminLogin = await request('POST', '/login', {
    email: 'admin1@rentalapp.com',
    password: 'Admin1#Rental801'
  });
  assert(resAdminLogin.status === 200, 'Admin login HTTP 200');
  assert(resAdminLogin.data.user && resAdminLogin.data.user.role === 'Admin', 'Admin user role returned correctly');
  assert(!!resAdminLogin.data.token, 'Admin JWT token received');
  adminToken = resAdminLogin.data.token;

  // 2. Landlord Login
  console.log('\n[2] Testing Landlord Login...');
  const resLandlordLogin = await request('POST', '/login', {
    email: 'karan@gmail.com',
    password: 'Karan#Pass901'
  });
  assert(resLandlordLogin.status === 200, 'Landlord login HTTP 200');
  assert(resLandlordLogin.data.user && resLandlordLogin.data.user.role === 'Landlord', 'Landlord role returned');
  assert(resLandlordLogin.data.user.landlord_id === 13, 'Landlord scoped to landlord_id 13');
  landlordToken = resLandlordLogin.data.token;

  // 3. Inactive Account Login Prevention
  console.log('\n[3] Testing Inactive Account Login Rejection...');
  const resInactiveLogin = await request('POST', '/login', {
    email: 'inactive@rentalapp.com',
    password: 'Inactive@123'
  });
  assert(resInactiveLogin.status === 403, 'Inactive account login rejected with HTTP 403 Forbidden');
  assert(resInactiveLogin.data.message.includes('deactivated'), 'Accurate deactivation message returned');

  // 4. Role-Based Access Control (RBAC)
  console.log('\n[4] Testing Role-Based Access Control (RBAC)...');
  const resLandlordAccessUsers = await request('GET', '/users', null, landlordToken);
  assert(resLandlordAccessUsers.status === 403, 'Landlord blocked from accessing Admin /users endpoint (HTTP 403)');

  const resAdminAccessUsers = await request('GET', '/users', null, adminToken);
  assert(resAdminAccessUsers.status === 200, 'Admin successfully accessed /users endpoint (HTTP 200)');
  assert(Array.isArray(resAdminAccessUsers.data.data), 'User list returned array');

  // 5. Password Reset Flow
  console.log('\n[5] Testing Password Reset Flow...');
  const resForgot = await request('POST', '/forgot-password', { email: 'admin@rentalapp.com' });
  assert(resForgot.status === 200, 'Forgot password request succeeded (HTTP 200)');
  assert(!!resForgot.data.reset_token, 'Reset token generated');

  const resReset = await request('POST', '/reset-password', {
    email: 'admin@rentalapp.com',
    reset_token: resForgot.data.reset_token,
    new_password: 'Admin@123NewPass'
  });
  assert(resReset.status === 200, 'Reset password succeeded with new password');

  // Reset back to original password for consistency
  const resForgot2 = await request('POST', '/forgot-password', { email: 'admin@rentalapp.com' });
  await request('POST', '/reset-password', {
    email: 'admin@rentalapp.com',
    reset_token: resForgot2.data.reset_token,
    new_password: 'Admin@123'
  });

  // 6. User Creation & Account Activation / Deactivation
  console.log('\n[6] Testing User Creation and Status Toggle...');
  const uniqueEmail = `test_landlord_${Date.now()}@testcorp.com`;
  const resCreateUser = await request('POST', '/users', {
    full_name: 'Test Corp Landlord',
    email: uniqueEmail,
    password: 'Password@123',
    role: 'Landlord',
    landlord_id: 2
  }, adminToken);
  assert(resCreateUser.status === 201, 'Admin created new Landlord user account in Supabase (HTTP 201)');
  const newUserId = resCreateUser.data.data.id;

  // Deactivate user
  const resDeactivate = await request('PUT', `/users/${newUserId}/status`, { status: 'Inactive' }, adminToken);
  assert(resDeactivate.status === 200, 'Admin deactivated newly created user');
  assert(resDeactivate.data.data.status === 'Inactive', 'User status confirmed Inactive');

  // Verify deactivated user cannot log in
  const resBlockedLogin = await request('POST', '/login', {
    email: uniqueEmail,
    password: 'Password@123'
  });
  assert(resBlockedLogin.status === 403, 'Newly deactivated user blocked from login');

  // Reactivate user
  const resReactivate = await request('PUT', `/users/${newUserId}/status`, { status: 'Active' }, adminToken);
  assert(resReactivate.status === 200, 'Admin reactivated user account');

  // 7. Dashboard Invoice Summary & Landlord Scoping
  console.log('\n[7] Testing Dashboard Summary & Scoping...');
  const resAdminSummary = await request('GET', '/dashboard/admin', null, adminToken);
  assert(resAdminSummary.status === 200, 'Admin summary HTTP 200');
  assert(resAdminSummary.data.data.summaryCards.totalInvoices >= 1, 'Admin sees all invoices across all landlords in Supabase');

  const resLandlordSummary = await request('GET', '/dashboard/landlord', null, landlordToken);
  assert(resLandlordSummary.status === 200, 'Landlord summary HTTP 200');
  assert(resLandlordSummary.data.data.landlord.id === 13, 'Landlord scoped strictly to own ID 13');
  assert(resLandlordSummary.data.data.summaryCards.myInvoices === 0, 'Landlord 13 only sees their own invoices');

  // 8. Master Data Change Log
  console.log('\n[8] Testing Master Data Change Log...');
  const resAuditLogs = await request('GET', '/audit/master-data', null, adminToken);
  assert(resAuditLogs.status === 200, 'Master data audit log HTTP 200');
  assert(Array.isArray(resAuditLogs.data.data), 'Audit entries retrieved from Supabase');

  // 9. Invoice Override Logging
  console.log('\n[9] Testing Invoice Override Logging with Mandatory Reason...');
  // Override without reason should fail
  const resOverrideNoReason = await request('POST', '/audit/invoice-override', {
    invoice_id: 2,
    reason: ''
  }, adminToken);
  assert(resOverrideNoReason.status === 400, 'Draft invoice override rejected when reason is empty (HTTP 400)');

  // Override with reason should succeed
  const resOverride = await request('POST', '/audit/invoice-override', {
    invoice_id: 2,
    reason: 'Power backup diesel expense adjusted after meter reconciliation with tenant',
    new_values: { additional_charges: 15000, total_amount: 80000 }
  }, adminToken);
  assert(resOverride.status === 200, 'Draft invoice override accepted with mandatory justification reason');
  assert(resOverride.data.audit.action === 'OVERRIDE', 'Audit entry logged as OVERRIDE in Supabase');

  // 10. Automated Data Backup & Test Restore
  console.log('\n[10] Testing Backup Creation & Dry-Run Test Restore...');
  const resBackup = await request('POST', '/backup/create', {}, adminToken);
  assert(resBackup.status === 201, 'Admin created full system backup');
  const backupId = resBackup.data.data.id;

  const resTestRestore = await request('POST', `/backup/test-restore/${backupId}`, {}, adminToken);
  assert(resTestRestore.status === 200, 'Dry-run test restore HTTP 200');
  assert(resTestRestore.data.report.integrity_status === 'PASSED', 'Backup integrity check PASSED');

  // 11. Invoice Register Report
  console.log('\n[11] Testing Invoice Register Report...');
  const resRegister = await request('GET', '/reports/invoice-register?period=2026-09', null, adminToken);
  assert(resRegister.status === 200, 'Invoice register HTTP 200');
  assert(resRegister.data.totals.grand_total_sum > 0, 'Totals calculated correctly from Supabase data');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  server.close();
  if (failed > 0) process.exit(1);
  process.exit(0);
}

server = app.listen(PORT, async () => {
  try {
    await runTests();
  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
});
