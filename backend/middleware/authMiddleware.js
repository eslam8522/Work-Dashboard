import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/** Verifies the Bearer token and attaches the user to req.user. */
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp -otpExpires');

    if (!user) return res.status(401).json({ error: 'User not found' });

    if (user.isBlocked) {
      return res
        .status(403)
        .json({ error: 'Your account has been suspended by the platform administrator.' });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

/** Restricts a route to the given roles. Use after `protect`. */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for your role.' });
    }
    next();
  };
