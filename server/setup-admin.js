import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import UserProfile from "./models/UserProfile.js";

const setupAdmin = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error("MONGODB_URI is not defined");
      process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "nshayn00@gmail.com";
    const adminPassword = "Mirror@2024123";
    const adminUsername = "admin_nshayn";

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    let user = await User.findOne({ email: adminEmail });

    if (user) {
      console.log("User exists, updating password, role, and status...");
      user.password = hashedPassword;
      user.role = "super_admin";
      user.status = "active";
      await user.save();
    } else {
      console.log("User does not exist, creating...");
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
      console.log("Profile does not exist, creating...");
      await UserProfile.create({
        user_email: adminEmail,
        display_name: "Super Admin",
      });
    } else {
        console.log("Profile exists.");
    }

    console.log("Admin account setup successful!");
    process.exit(0);
  } catch (err) {
    console.error("Error setting up admin account:", err);
    process.exit(1);
  }
};

setupAdmin();
