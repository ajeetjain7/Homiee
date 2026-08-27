const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'homiee_super_secret_key_123';

/**
 * Strict Authentication Middleware
 * Requires a valid Bearer JWT token in Authorization header.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload.' });
    }

    req.user = {
      userId: userId.toString(),
      email: (decoded.email || '').toLowerCase().trim(),
      profileComplete: Boolean(decoded.profileComplete)
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
};

/**
 * Optional Authentication Middleware
 * If token is present and valid, attaches req.user; otherwise proceeds as guest without error.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        if (userId) {
          req.user = {
            userId: userId.toString(),
            email: (decoded.email || '').toLowerCase().trim(),
            profileComplete: Boolean(decoded.profileComplete)
          };
        }
      } catch {
        // Fall through as guest
      }
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
