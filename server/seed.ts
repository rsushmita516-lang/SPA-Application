import bcrypt from 'bcryptjs';
import { getDb, closeDb } from './db.js';

export interface SeedUser {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'General User';
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SeedRecord {
  recordId: string;
  title: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Completed';
  lastUpdated: string;
  ownerId: string;
  ownerName: string;
  description: string;
}

export async function seedDatabase(force = false): Promise<void> {
  const db = await getDb();
  const usersCol = db.collection<SeedUser>('users');
  const recordsCol = db.collection<SeedRecord>('records');

  const existingUsersCount = await usersCol.countDocuments();
  if (existingUsersCount > 0 && !force) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  if (force) {
    console.log('[Seed] Force reset requested. Clearing users and records...');
    await usersCol.deleteMany({});
    await recordsCol.deleteMany({});
  }

  console.log('[Seed] Hashing passwords and preparing seed entities...');
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const userPasswordHash = await bcrypt.hash('User@123', 10);

  const initialUsers: SeedUser[] = [
    {
      userId: 'admin1',
      name: 'Eleanor Vance',
      email: 'eleanor.vance@portal.internal',
      passwordHash: adminPasswordHash,
      role: 'Admin',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      userId: 'admin2',
      name: 'Marcus Chen',
      email: 'marcus.chen@portal.internal',
      passwordHash: adminPasswordHash,
      role: 'Admin',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      userId: 'user1',
      name: 'Sarah Jenkins',
      email: 'sarah.j@portal.internal',
      passwordHash: userPasswordHash,
      role: 'General User',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      userId: 'user2',
      name: 'David Okafor',
      email: 'david.o@portal.internal',
      passwordHash: userPasswordHash,
      role: 'General User',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      userId: 'user3',
      name: 'Elena Rostova',
      email: 'elena.r@portal.internal',
      passwordHash: userPasswordHash,
      role: 'General User',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ];

  await usersCol.insertMany(initialUsers);
  console.log(`[Seed] Seeded ${initialUsers.length} users (2 Admins, 3 General Users).`);

  const initialRecords: SeedRecord[] = [
    {
      recordId: 'REC-001',
      title: 'Global SOC-2 Type II Compliance Readiness',
      category: 'Compliance',
      status: 'In Progress',
      lastUpdated: new Date(Date.now() - 1 * 86400000).toISOString(),
      ownerId: 'user1',
      ownerName: 'Sarah Jenkins',
      description: 'Annual compliance review and policy alignment for EU and APAC regions.'
    },
    {
      recordId: 'REC-002',
      title: 'Zero-Trust Network Architecture Migration',
      category: 'Infrastructure',
      status: 'Open',
      lastUpdated: new Date(Date.now() - 2 * 86400000).toISOString(),
      ownerId: 'user1',
      ownerName: 'Sarah Jenkins',
      description: 'Phased rollout of identity-aware perimeter proxies for remote engineers.'
    },
    {
      recordId: 'REC-003',
      title: 'Third-Party Vendor Risk Matrix 2026',
      category: 'Security Audit',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 3 * 86400000).toISOString(),
      ownerId: 'user1',
      ownerName: 'Sarah Jenkins',
      description: 'Evaluation of tier-1 SaaS integrations and third-party data handlers.'
    },
    {
      recordId: 'REC-004',
      title: 'Client SSO Onboarding — Meridian Financial',
      category: 'Client Onboarding',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 4 * 86400000).toISOString(),
      ownerId: 'user1',
      ownerName: 'Sarah Jenkins',
      description: 'Configured SAML 2.0 with Okta directory integration.'
    },
    {
      recordId: 'REC-005',
      title: 'Data Loss Prevention (DLP) Endpoint Rule Review',
      category: 'Security Audit',
      status: 'In Progress',
      lastUpdated: new Date(Date.now() - 5 * 86400000).toISOString(),
      ownerId: 'user2',
      ownerName: 'David Okafor',
      description: 'Updating regex patterns for sensitive financial and health records.'
    },
    {
      recordId: 'REC-006',
      title: 'Kubernetes Multi-Cluster Ingress Hardening',
      category: 'Infrastructure',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 6 * 86400000).toISOString(),
      ownerId: 'user2',
      ownerName: 'David Okafor',
      description: 'Mutual TLS enforcement across production service meshes.'
    },
    {
      recordId: 'REC-007',
      title: 'Automated Disaster Recovery Drill Report',
      category: 'DevOps',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 7 * 86400000).toISOString(),
      ownerId: 'user2',
      ownerName: 'David Okafor',
      description: 'Cross-region snapshot restoration and RTO/RPO validation.'
    },
    {
      recordId: 'REC-008',
      title: 'Enterprise Key Management Service (KMS) Rotation',
      category: 'Access Review',
      status: 'Open',
      lastUpdated: new Date(Date.now() - 8 * 86400000).toISOString(),
      ownerId: 'user2',
      ownerName: 'David Okafor',
      description: 'Biannual rotation of database envelope encryption master keys.'
    },
    {
      recordId: 'REC-009',
      title: 'PostgreSQL Read-Replica Sharding Optimization',
      category: 'Data Migration',
      status: 'In Progress',
      lastUpdated: new Date(Date.now() - 9 * 86400000).toISOString(),
      ownerId: 'user3',
      ownerName: 'Elena Rostova',
      description: 'Benchmarking latency reduction under high concurrent analytics queries.'
    },
    {
      recordId: 'REC-010',
      title: 'Customer Data Export API Rate Limiting',
      category: 'Compliance',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 10 * 86400000).toISOString(),
      ownerId: 'user3',
      ownerName: 'Elena Rostova',
      description: 'Implementing token-bucket rate limiter per organization tenant.'
    },
    {
      recordId: 'REC-011',
      title: 'Privileged Access Management (PAM) Quarterly Audit',
      category: 'Access Review',
      status: 'Open',
      lastUpdated: new Date(Date.now() - 11 * 86400000).toISOString(),
      ownerId: 'user3',
      ownerName: 'Elena Rostova',
      description: 'Reconciling temporary bastion session logs and sudoer grants.'
    },
    {
      recordId: 'REC-012',
      title: 'Enterprise Tenant Isolation Verification',
      category: 'Infrastructure',
      status: 'In Progress',
      lastUpdated: new Date(Date.now() - 12 * 86400000).toISOString(),
      ownerId: 'user3',
      ownerName: 'Elena Rostova',
      description: 'Verifying namespace boundary security and storage encryption keys.'
    },
    {
      recordId: 'REC-013',
      title: 'Root Certificate Authority Expiration Renewal',
      category: 'Infrastructure',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 13 * 86400000).toISOString(),
      ownerId: 'admin1',
      ownerName: 'Eleanor Vance',
      description: 'Generating intermediate CA certificates and distributing trust stores.'
    },
    {
      recordId: 'REC-014',
      title: 'Annual Security Governance & Policy Update',
      category: 'Compliance',
      status: 'In Progress',
      lastUpdated: new Date(Date.now() - 14 * 86400000).toISOString(),
      ownerId: 'admin1',
      ownerName: 'Eleanor Vance',
      description: 'Executive review and sign-off on updated data retention guidelines.'
    },
    {
      recordId: 'REC-015',
      title: 'Core Telemetry Pipeline Upgrade to OpenTelemetry',
      category: 'DevOps',
      status: 'Open',
      lastUpdated: new Date(Date.now() - 15 * 86400000).toISOString(),
      ownerId: 'admin1',
      ownerName: 'Eleanor Vance',
      description: 'Standardizing distributed trace propagation headers across micro-gateways.'
    },
    {
      recordId: 'REC-016',
      title: 'Partner API OAuth 2.1 Specification Harmonization',
      category: 'Access Review',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 16 * 86400000).toISOString(),
      ownerId: 'admin2',
      ownerName: 'Marcus Chen',
      description: 'Enforcing PKCE on all confidential and public authorization flows.'
    },
    {
      recordId: 'REC-017',
      title: 'Legacy MongoDB Replica Cluster Decommissioning',
      category: 'Data Migration',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 17 * 86400000).toISOString(),
      ownerId: 'admin2',
      ownerName: 'Marcus Chen',
      description: 'Sanitization of physical drives following zero-loss data replication.'
    },
    {
      recordId: 'REC-018',
      title: 'Automated CI/CD Vulnerability Scanning Pipeline',
      category: 'DevOps',
      status: 'In Progress',
      lastUpdated: new Date(Date.now() - 18 * 86400000).toISOString(),
      ownerId: 'admin2',
      ownerName: 'Marcus Chen',
      description: 'Static application security testing integration for pull requests.'
    },
    {
      recordId: 'REC-019',
      title: 'Cloud Cost Governance and Reserved Instance Planning',
      category: 'Infrastructure',
      status: 'Open',
      lastUpdated: new Date(Date.now() - 19 * 86400000).toISOString(),
      ownerId: 'user1',
      ownerName: 'Sarah Jenkins',
      description: 'Quarterly review of auto-scaling groups and reserved capacity commitments.'
    },
    {
      recordId: 'REC-020',
      title: 'Bug Bounty Disclosure Assessment — Portal Webhook',
      category: 'Security Audit',
      status: 'Completed',
      lastUpdated: new Date(Date.now() - 20 * 86400000).toISOString(),
      ownerId: 'user2',
      ownerName: 'David Okafor',
      description: 'Mitigated header tampering vulnerability reported through HackerOne.'
    }
  ];

  await recordsCol.insertMany(initialRecords);
  console.log(`[Seed] Seeded ${initialRecords.length} records.`);
}

// Support running directly via `tsx server/seed.ts`
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase(true)
    .then(async () => {
      console.log('[Seed] Standalone seed completed successfully.');
      await closeDb();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Error during seeding:', err);
      await closeDb();
      process.exit(1);
    });
}
