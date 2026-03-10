import bcrypt from "bcryptjs";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

export const ensureSuperAdmin = async () => {
  try {
    const adminEmail = "nshayn00@gmail.com";
    const adminPassword = "Mirror@2024123";
    const adminUsername = "admin_nshayn";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let user = await User.findOne({ email: adminEmail });

    if (user) {
      // Always update password, role, and status to ensure they are correct
      user.password = hashedPassword;
      user.role = "super_admin";
      user.status = "active";
      await user.save();
    } else {
      user = await User.create({
        email: adminEmail,
        password: hashedPassword,
        username: adminUsername,
        role: "super_admin",
        status: "active",
      });
    }

    let profile = await UserProfile.findOne({ user_email: adminEmail });
    if (!profile) {
      await UserProfile.create({
        user_email: adminEmail,
        display_name: "Super Admin",
      });
    }
  } catch (err) {
    console.error("Failed to ensure super admin exists", err);
  }
};
