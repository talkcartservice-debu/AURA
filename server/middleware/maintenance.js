import jwt from 'jsonwebtoken';
import SystemSetting from '../models/SystemSetting.js';

const maintenance = async (req, res, next) => {
  try {
    // Skip maintenance check for admin routes and health check
    if (req.path.startsWith('/api/admin') || req.path === '/api/health') {
      return next();
    }

    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' });
    
    if (setting && setting.value === true) {
      // Try to get role from token if present to allow admin access during maintenance
      let role = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          role = decoded.role;
        } catch (err) {
          // Token invalid, ignore
        }
      }

      if (['super_admin', 'admin', 'moderator', 'support'].includes(role)) {
        return next();
      }

      return res.status(503).json({ 
        error: "Platform is currently under maintenance. Please try again later.",
        maintenance: true
      });
    }

    next();
  } catch (err) {
    next(); // Don't block the app if settings check fails
  }
};

export default maintenance;
