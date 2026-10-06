import http from 'http';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import { getDb, getMongoClient, closeDb } from '../server/db.js';
import { seedDatabase } from '../server/seed.js';
import { verifyCsrf } from '../server/middleware.js';
import authRoutes from '../server/routes/auth.routes.js';
import userRoutes from '../server/routes/user.routes.js';
import recordRoutes from '../server/routes/record.routes.js';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(suite: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ suite, name, passed: true, durationMs: Date.now() - start });
    console.log(`  ✓ ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ suite, name, passed: false, error: err.message, durationMs: Date.now() - start });
    console.error(`  ✗ ${name}: ${err.message}`);
  }
}

async function request(
  serverUrl: string,
  method: string,
  path: string,
  body?: any,
  cookies?: string[],
  csrfToken?: string
): Promise<{ status: number; data: any; cookies: string[] }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const headers: Record<string, string> = {};

    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (cookies && cookies.length > 0) {
      // Extract only name=value part before the first semicolon
      headers['Cookie'] = cookies.map((c) => c.split(';')[0]).join('; ');
    }
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {}

          const resCookies = res.headers['set-cookie'] || [];
          resolve({
            status: res.statusCode || 500,
            data,
            cookies: Array.isArray(resCookies) ? resCookies : [resCookies],
          });
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('   USER ACCESS PORTAL TEST RUNNER');
  console.log('========================================\n');

  // Initialize DB & Seed
  await getDb();
  await seedDatabase(true);

  // Setup express test server on ephemeral port
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      name: 'user_portal_sid',
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: getMongoClient(),
        dbName: 'user_access_portal',
      }),
      cookie: { httpOnly: true, secure: false },
    })
  );
  app.use('/api', verifyCsrf);
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/records', recordRoutes);

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`[Test Server] Running on ${baseUrl}\n`);

  let adminCookie: string[] = [];
  let adminCsrf = '';
  let userCookie: string[] = [];
  let userCsrf = '';

  // 1. AUTHENTICATION TESTS
  console.log('[Suite 1: Authentication]');

  await runTest('Authentication', 'Valid Admin Login Succeeds and Sets Session & CSRF', async () => {
    const res = await request(baseUrl, 'POST', '/api/auth/login', {
      userId: 'admin1',
      password: 'Admin@123',
      selectedRole: 'Admin',
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data.success === true, 'Expected success === true');
    assert(res.data.user.role === 'Admin', 'Expected user.role === Admin');
    assert(!!res.data.csrfToken, 'Expected csrfToken in login response');
    adminCookie = res.cookies;
    adminCsrf = res.data.csrfToken;
  });

  await runTest('Authentication', 'Valid General User Login Succeeds', async () => {
    const res = await request(baseUrl, 'POST', '/api/auth/login', {
      userId: 'user1',
      password: 'User@123',
      selectedRole: 'General User',
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data.user.role === 'General User', 'Expected General User role');
    userCookie = res.cookies;
    userCsrf = res.data.csrfToken;
  });

  await runTest('Authentication', 'Invalid Password Returns 401 Unauthorized', async () => {
    const res = await request(baseUrl, 'POST', '/api/auth/login', {
      userId: 'admin1',
      password: 'WrongPassword',
      selectedRole: 'Admin',
    });
    assert(res.status === 401, `Expected status 401, got ${res.status}`);
  });

  await runTest('Authentication', 'Role Mismatch (User picking Admin) is Strictly Rejected with 403', async () => {
    // user1 is a General User in database, attempting to log in as Admin
    const res = await request(baseUrl, 'POST', '/api/auth/login', {
      userId: 'user1',
      password: 'User@123',
      selectedRole: 'Admin',
    });
    assert(res.status === 403, `Expected status 403, got ${res.status}`);
    assert(res.data.error.includes('does not match'), 'Expected role mismatch error message');
  });

  await runTest('Authentication', 'Session Restore via GET /api/auth/session', async () => {
    const res = await request(baseUrl, 'GET', '/api/auth/session', undefined, userCookie);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data.authenticated === true, 'Expected authenticated === true');
    assert(res.data.user.userId === 'user1', 'Expected user1 profile');
  });

  // 2. ROLE RESTRICTIONS TESTS
  console.log('\n[Suite 2: Role Restrictions]');

  await runTest('Role Restrictions', 'General User is Forbidden from GET /api/users (403)', async () => {
    const res = await request(baseUrl, 'GET', '/api/users', undefined, userCookie);
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest('Role Restrictions', 'General User is Forbidden from Creating Users (403)', async () => {
    const res = await request(
      baseUrl,
      'POST',
      '/api/users',
      {
        userId: 'hacker',
        name: 'Hacker',
        email: 'hacker@test.com',
        password: 'Password@123',
        role: 'Admin',
      },
      userCookie,
      userCsrf
    );
    assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
  });

  await runTest('Role Restrictions', 'Admin is Permitted to Access GET /api/users (200)', async () => {
    const res = await request(baseUrl, 'GET', '/api/users', undefined, adminCookie);
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(Array.isArray(res.data.users), 'Expected users array');
    assert(res.data.users.length >= 5, 'Expected at least 5 seeded users');
  });

  // 3. RECORD OWNERSHIP TESTS
  console.log('\n[Suite 3: Record Ownership Enforced on Backend]');

  await runTest('Record Ownership', 'General User Only Receives Their Owned Records', async () => {
    const res = await request(baseUrl, 'GET', '/api/records', undefined, userCookie);
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(Array.isArray(res.data.records), 'Expected records array');
    // All records returned must have ownerId === 'user1'
    for (const record of res.data.records) {
      assert(record.ownerId === 'user1', `Record ${record.recordId} has owner ${record.ownerId}, expected user1`);
    }
  });

  await runTest('Record Ownership', 'General User Total Count Reflects Scoped Ownership', async () => {
    const userRes = await request(baseUrl, 'GET', '/api/records?limit=50', undefined, userCookie);
    const adminRes = await request(baseUrl, 'GET', '/api/records?limit=50', undefined, adminCookie);
    assert(userRes.data.total < adminRes.data.total, 'User total must be less than global Admin total');
    assert(adminRes.data.total >= 20, 'Admin must see at least 20 seeded records');
  });

  // 4. ADMIN OPERATIONS & SELF-PROTECTION
  console.log('\n[Suite 4: Admin Operations & Self-Protection]');

  await runTest('Admin Operations', 'Admin Can Create New User with MongoDB Persistence', async () => {
    const res = await request(
      baseUrl,
      'POST',
      '/api/users',
      {
        userId: 'claire_ops',
        name: 'Claire Ops',
        email: 'claire.ops@portal.internal',
        password: 'Claire@Password123',
        role: 'General User',
      },
      adminCookie,
      adminCsrf
    );
    assert(res.status === 201, `Expected 201 Created, got ${res.status}`);
    assert(res.data.user.userId === 'claire_ops', 'User ID matches created user');
  });

  await runTest('Self-Protection', 'Admin CANNOT Deactivate Their Own Account (400)', async () => {
    const res = await request(
      baseUrl,
      'PATCH',
      '/api/users/admin1',
      { status: 'Inactive' },
      adminCookie,
      adminCsrf
    );
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    assert(res.data.error.includes('cannot deactivate your own'), 'Expected self-deactivation protection message');
  });

  await runTest('Self-Protection', 'Admin CANNOT Demote Their Own Account (400)', async () => {
    const res = await request(
      baseUrl,
      'PATCH',
      '/api/users/admin1',
      { role: 'General User' },
      adminCookie,
      adminCsrf
    );
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    assert(res.data.error.includes('cannot demote your own'), 'Expected self-demotion protection message');
  });

  await runTest('Self-Protection', 'Admin CANNOT Delete Their Own Account (400)', async () => {
    const res = await request(
      baseUrl,
      'DELETE',
      '/api/users/admin1',
      undefined,
      adminCookie,
      adminCsrf
    );
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    assert(res.data.error.includes('cannot delete your own'), 'Expected self-deletion protection message');
  });

  await runTest('Admin Operations', 'Admin Can Soft-Delete Another User (MongoDB Marked isDeleted)', async () => {
    const res = await request(
      baseUrl,
      'DELETE',
      '/api/users/claire_ops',
      undefined,
      adminCookie,
      adminCsrf
    );
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(res.data.success === true, 'Expected success === true');
  });

  // 5. INDEPENDENT LOADING & DELAY SIMULATION
  console.log('\n[Suite 5: Independent Loading & Delay Simulation]');

  await runTest('Delay Simulation', 'GET /api/users/me?delayMs=300 Applies Non-blocking Delay', async () => {
    const start = Date.now();
    const res = await request(baseUrl, 'GET', '/api/users/me?delayMs=300', undefined, userCookie);
    const elapsed = Date.now() - start;
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(elapsed >= 250, `Expected elapsed >= 250ms, was ${elapsed}ms`);
  });

  await runTest('Delay Simulation', 'GET /api/records?delayMs=400 Applies Non-blocking Delay', async () => {
    const start = Date.now();
    const res = await request(baseUrl, 'GET', '/api/records?delayMs=400', undefined, userCookie);
    const elapsed = Date.now() - start;
    assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
    assert(elapsed >= 350, `Expected elapsed >= 350ms, was ${elapsed}ms`);
  });

  // Clean up server
  server.close();
  await closeDb();

  // Print Summary
  console.log('\n========================================');
  console.log('   TEST EXECUTION SUMMARY');
  console.log('========================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.error('\nFAILED TESTS:');
    results.filter((r) => !r.passed).forEach((r) => console.error(` - [${r.suite}] ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\nALL TESTS PASSED SUCCESSFULLY! ✓\n');
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
