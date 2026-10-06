import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare module 'express-session' {
  interface SessionData {
    user?: {
      userId: string;
      name: string;
      email: string;
      role: 'Admin' | 'General User';
    };
    csrfToken?: string;
  }
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.user) {
    res.status(401).json({ error: 'Unauthorized: Session missing or expired' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session || !req.session.user) {
    res.status(401).json({ error: 'Unauthorized: Session missing or expired' });
    return;
  }
  if (req.session.user.role !== 'Admin') {
    res.status(403).json({ error: 'Forbidden: Admin privilege required' });
    return;
  }
  next();
}

/**
 * Validates CSRF token on mutating requests (POST, PATCH, DELETE, PUT)
 * Excludes /api/auth/login and /api/auth/logout if session does not yet exist.
 */
export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PATCH', 'DELETE', 'PUT'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Exempt public login endpoint from requiring pre-existing CSRF
  const normalizedPath = (req.originalUrl || req.path || '').split('?')[0];
  if (normalizedPath === '/api/auth/login' || req.path === '/login' || req.path === '/auth/login') {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!sessionToken || !clientToken || clientToken !== sessionToken) {
    res.status(403).json({
      error: 'Invalid or missing CSRF token',
      code: 'CSRF_INVALID'
    });
    return;
  }

  next();
}

/**
 * Non-blocking delay simulation helper
 */
export async function handleDelaySimulation(req: Request): Promise<number> {
  const isSimulationEnabled = process.env.ENABLE_API_DELAY_SIMULATION !== 'false';
  if (!isSimulationEnabled) {
    return 0;
  }

  const rawDelay = req.query.delayMs;
  if (rawDelay === undefined || rawDelay === null || rawDelay === '') {
    return 0;
  }

  const parsed = parseInt(String(rawDelay), 10);
  if (isNaN(parsed) || parsed < 0) {
    return 0;
  }

  // Cap at 10,000ms for safety
  const safeDelay = Math.min(parsed, 10000);
  if (safeDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, safeDelay));
  }
  return safeDelay;
}
