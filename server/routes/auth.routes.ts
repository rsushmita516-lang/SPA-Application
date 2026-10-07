import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { generateCsrfToken } from '../middleware.js';

const router = Router();

// GET /api/auth/session — Restore authentication
router.get('/session', async (req: Request, res: Response) => {
  if (req.session && req.session.user) {
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    res.json({
      authenticated: true,
      user: req.session.user,
      csrfToken: req.session.csrfToken,
    });
  } else {
    // Generate an initial CSRF token for the session even before login
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCsrfToken();
    }
    res.json({
      authenticated: false,
      user: null,
      csrfToken: req.session.csrfToken,
    });
  }
});

// POST /api/auth/register - Create a new account without creating a session
router.post('/register', async (req: Request, res: Response) => {
  const { userId, name, email, password, role } = req.body;

  if (!userId || !name || !email || !password || !role) {
    res.status(400).json({ error: 'All fields (User ID, Name, Email, Password, Role) are required.' });
    return;
  }

  const cleanUserId = String(userId).trim().toLowerCase();
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(cleanUserId)) {
    res.status(400).json({ error: 'User ID must be 3-20 characters alphanumeric (dashes/underscores allowed).' });
    return;
  }
  if (cleanName.length < 2) {
    res.status(400).json({ error: 'Name must be at least 2 characters long.' });
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
  if (role !== 'Admin' && role !== 'General User') {
    res.status(400).json({ error: 'Role must be either "Admin" or "General User".' });
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
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role,
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

// POST /api/auth/login — Sign in
router.post('/login', async (req: Request, res: Response) => {
  const { userId, password, selectedRole } = req.body;

  if (!userId || !password || !selectedRole) {
    res.status(400).json({ error: 'User ID, Password, and Role are all required.' });
    return;
  }

  if (selectedRole !== 'Admin' && selectedRole !== 'General User') {
    res.status(400).json({ error: 'Role must be either "Admin" or "General User".' });
    return;
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ userId: String(userId).trim() });

    if (!user || user.isDeleted) {
      res.status(401).json({ error: 'Invalid User ID or password.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid User ID or password.' });
      return;
    }

    if (user.status !== 'Active') {
      res.status(403).json({ error: 'Account is deactivated. Please contact an administrator.' });
      return;
    }

    // Role Enforcement Rule:
    // "Validate credentials through the API. The selected role must match the user’s stored role;
    // choosing Admin must never grant additional permissions."
    if (user.role !== selectedRole) {
      res.status(403).json({
        error: `Selected role (${selectedRole}) does not match your assigned account role (${user.role}). Access denied.`,
      });
      return;
    }

    // Session regeneration to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to initialize authenticated session.' });
        return;
      }

      const sessionUser = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role as 'Admin' | 'General User',
      };

      const csrfToken = generateCsrfToken();
      req.session.user = sessionUser;
      req.session.csrfToken = csrfToken;

      // Update lastLoginAt asynchronously
      db.collection('users').updateOne(
        { userId: user.userId },
        { $set: { lastLoginAt: new Date().toISOString() } }
      ).catch((e) => console.error('Failed to record lastLoginAt:', e));

      req.session.save((saveErr) => {
        if (saveErr) {
          res.status(500).json({ error: 'Failed to persist session.' });
          return;
        }
        res.json({
          success: true,
          user: sessionUser,
          csrfToken,
        });
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An unexpected internal error occurred during login.' });
  }
});

// POST /api/auth/logout — Sign out
router.post('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to destroy session.' });
        return;
      }
      res.clearCookie('user_portal_sid');
      res.json({ success: true, message: 'Logged out successfully.' });
    });
  } else {
    res.json({ success: true });
  }
});

export default router;
