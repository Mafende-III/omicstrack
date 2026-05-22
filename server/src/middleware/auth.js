import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { capabilitiesForRole } from '../constants/capabilities.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    // Capabilities live on the JWT for newly-issued tokens. For tokens issued
    // before migration 008 (legacy JWTs still in flight), derive the effective
    // capabilities from the role so authorization keeps working until the
    // token rotates.
    const capabilities = Array.isArray(payload.capabilities) && payload.capabilities.length > 0
      ? payload.capabilities
      : capabilitiesForRole(payload.role);
    req.user = {
      id: payload.sub,
      role: payload.role,
      sites: payload.sites || [],
      canSeePii: payload.canSeePii !== false,
      capabilities,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
