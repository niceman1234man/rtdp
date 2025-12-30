import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  try {
    const auth = String(req.headers.authorization || '');
    if (!auth) return next();
    const parts = auth.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];
    if (!token) return next();
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET || 'dev-secret';
    const decoded = jwt.verify(token, secret);
    if (decoded) {
      req.user = { userId: decoded.userId || decoded.id || decoded._id, email: decoded.email, role: decoded.role };
    }
  } catch (e) {
    // ignore token errors — we don't want to block requests, just won't set req.user
    console.warn('authMiddleware: token parse failed', e?.message || e);
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ message: 'Authentication required' });
    // Admins are allowed to perform any role-restricted action
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}