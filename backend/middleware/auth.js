import jwt from 'jsonwebtoken';


export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.warn("No Authorization header");
    return next();
  }
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    console.warn("Invalid auth header format");
    return next();
  }
  try {
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET || "dev-secret";
    const decoded = jwt.verify(token, secret);
    console.log("Decoded JWT:", decoded);
    req.user = {
      userId: decoded.userId || decoded.id || decoded._id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    console.warn("JWT verification failed:", err.message);
    // Don't block the request for public endpoints — leave `req.user` undefined
    // Protected routes use `requireAuth` which will enforce authentication.
    return next();
  }
  next();
}

export function requireAuth(req, res, next) {
  console.log("AUTH HEADER:", req.headers.authorization);
  console.log("REQ USER:", req.user);

  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "Authentication required" });
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