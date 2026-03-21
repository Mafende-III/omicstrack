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
