import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { requireAuth, requireAdmin, handleDelaySimulation } from '../middleware.js';

const router = Router();

// GET /api/users/me — Fetch profile (supports ?delayMs=...)
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  await handleDelaySimulation(req);

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne(
      { userId: req.session.user!.userId },
      { projection: { passwordHash: 0 } }
    );

    if (!user || user.isDeleted) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || null,
      serverDurationMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// GET /api/users — List users for Admin
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    // Exclude soft-deleted users or return all with isDeleted flag
    const users = await db.collection('users')
      .find({}, { projection: { passwordHash: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      users,
      total: users.length,
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch user list.' });
  }
});

// POST /api/users — Create user (Admin only)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { userId, name, email, password, role } = req.body;

  if (!userId || !name || !email || !password || !role) {
    res.status(400).json({ error: 'All fields (User ID, Name, Email, Password, Role) are required.' });
    return;
  }

  const cleanUserId = String(userId).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanRole = role === 'Admin' ? 'Admin' : 'General User';

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUserId)) {
    res.status(400).json({ error: 'User ID must be 3-20 characters alphanumeric (dashes/underscores allowed).' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  if (String(password).length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  try {
    const db = await getDb();
    const existing = await db.collection('users').findOne({ userId: cleanUserId });
    if (existing) {
      res.status(409).json({ error: `User ID '${cleanUserId}' already exists.` });
      return;
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const newUser = {
      userId: cleanUserId,
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      role: cleanRole,
      status: 'Active' as const,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    await db.collection('users').insertOne(newUser);

    res.status(201).json({
      success: true,
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        isDeleted: newUser.isDeleted,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PATCH /api/users/:id — Edit user or account status (Admin only)
router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const currentAdminId = req.session.user!.userId;
  const { name, email, role, status } = req.body;

  try {
    const db = await getDb();
    const targetUser = await db.collection('users').findOne({ userId: targetUserId });

    if (!targetUser) {
      res.status(404).json({ error: `User '${targetUserId}' not found.` });
      return;
    }

    // Protection rule: "Prevent an Admin from deleting, deactivating, or demoting their own account."
    if (targetUserId === currentAdminId) {
      if (status && status !== 'Active') {
        res.status(400).json({ error: 'Self-modification forbidden: You cannot deactivate your own Admin account.' });
        return;
      }
      if (role && role !== 'Admin') {
        res.status(400).json({ error: 'Self-modification forbidden: You cannot demote your own Admin account.' });
        return;
      }
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = String(name).trim();
    if (email) updates.email = String(email).trim().toLowerCase();
    if (role && (role === 'Admin' || role === 'General User')) updates.role = role;
    if (status && (status === 'Active' || status === 'Inactive')) updates.status = status;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid update fields provided.' });
      return;
    }

    await db.collection('users').updateOne(
      { userId: targetUserId },
      { $set: updates }
    );

    const updatedUser = await db.collection('users').findOne(
      { userId: targetUserId },
      { projection: { passwordHash: 0 } }
    );

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /api/users/:id — Soft-delete user (Admin only)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const targetUserId = req.params.id;
  const currentAdminId = req.session.user!.userId;

  // Protection rule: "Prevent an Admin from deleting... their own account. Implement deletion as soft deletion."
  if (targetUserId === currentAdminId) {
    res.status(400).json({ error: 'Self-modification forbidden: You cannot delete your own Admin account.' });
    return;
  }

  try {
    const db = await getDb();
    const targetUser = await db.collection('users').findOne({ userId: targetUserId });

    if (!targetUser) {
      res.status(404).json({ error: `User '${targetUserId}' not found.` });
      return;
    }

    await db.collection('users').updateOne(
      { userId: targetUserId },
      {
        $set: {
          isDeleted: true,
          status: 'Inactive',
          deletedAt: new Date().toISOString(),
        },
      }
    );

    res.json({
      success: true,
      message: `User '${targetUserId}' has been soft-deleted.`,
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to soft-delete user.' });
  }
});

export default router;
