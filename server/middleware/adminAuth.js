import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const adminAuth = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Authentication required' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) return res.status(404).json({ error: 'User not found' });

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};

export default adminAuth;
