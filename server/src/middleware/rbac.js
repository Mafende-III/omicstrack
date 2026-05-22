export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Capability-based authorization. Pass one or more capability names; the
 * caller needs ANY of them to proceed.
 *
 * Example:
 *   router.post('/patients', authenticate, requireCapability('add_patient'), createPatient);
 */
export function requireCapability(...capabilities) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userCaps = req.user.capabilities || [];
    const ok = capabilities.some((c) => userCaps.includes(c));
    if (!ok) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: capabilities,
      });
    }
    next();
  };
}

export function applySiteFilter(req, res, next) {
  if (req.user.role === 'entry') {
    if (!req.user.sites || req.user.sites.length === 0) {
      req.siteFilter = ['__NONE__'];
    } else {
      req.siteFilter = req.user.sites;
    }
  } else {
    req.siteFilter = null;
  }
  next();
}
