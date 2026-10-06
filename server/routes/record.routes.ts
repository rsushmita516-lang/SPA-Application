import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import { requireAuth, handleDelaySimulation } from '../middleware.js';

const router = Router();

// GET /api/records — Fetch authorized records
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const startTime = Date.now();
  await handleDelaySimulation(req);

  const currentUser = req.session.user!;
  const isAdmin = currentUser.role === 'Admin';

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const page = Math.max(1, parseInt(String(req.query.page || 1), 10));
  const limit = Math.max(1, Math.min(50, parseInt(String(req.query.limit || 5), 10)));
  const skip = (page - 1) * limit;

  try {
    const db = await getDb();
    const query: Record<string, any> = {};

    // Enforce role-based ownership filter on the backend:
    // General Users only see records where ownerId === currentUser.userId.
    // Admins see all records.
    if (!isAdmin) {
      query.ownerId = currentUser.userId;
    }

    // Apply status filter
    if (status && status !== 'All') {
      query.status = status;
    }

    // Apply search filter on title, category, or recordId
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { recordId: searchRegex },
        { ownerName: searchRegex },
      ];
    }

    // Apply ownership restrictions to both records and pagination totals
    const total = await db.collection('records').countDocuments(query);
    const records = await db.collection('records')
      .find(query)
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      records,
      total,
      page,
      limit,
      totalPages,
      serverDurationMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ error: 'Failed to retrieve records.' });
  }
});

export default router;
