import SystemSetting from '../models/SystemSetting.js';

const maintenance = async (req, res, next) => {
  try {
    // Skip maintenance check for admin routes and health check
    if (req.path.startsWith('/api/admin') || req.path === '/api/health') {
      return next();
    }

    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' });
    
    if (setting && setting.value === true) {
      // Allow admins to still access the app if they are logged in
      const role = req.user?.role;
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
