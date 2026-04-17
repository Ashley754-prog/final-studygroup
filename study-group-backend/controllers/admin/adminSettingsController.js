import { pool } from "../../config/db.js";
import bcrypt from "bcryptjs";

// GET admin profile
export const getAdminProfile = async (req, res) => {
  const { id } = req.params;
  
  console.log("Fetching admin profile for ID:", id);
  
  try {
    const [admin] = await pool.execute(
      `SELECT id, username, email, first_name, last_name, middle_name, 
              is_admin, is_verified, created_at, status
       FROM users WHERE id = ? AND is_admin = 1`,
      [id]
    );
    
    console.log("Admin query result:", admin);
    
    if (admin.length === 0) {
      console.log("Admin not found for ID:", id);
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Add default values for settings columns that don't exist in database
    const adminProfile = {
      ...admin[0],
      language: "English",
      timezone: "Asia/Manila (GMT+8)",
      notifications: true,
      two_factor_auth: false
    };
    
    console.log("Admin profile data:", adminProfile);
    res.json(adminProfile);
  } catch (err) {
    console.error("Get admin profile error:", err);
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
};

// UPDATE admin profile
export const updateAdminProfile = async (req, res) => {
  const { id } = req.params;
  const { full_name, email } = req.body;  // Changed from fullName to full_name
  
  console.log("Update admin profile request body:", req.body);
  console.log("full_name:", full_name);
  console.log("email:", email);
  
  try {
    // Validate admin exists
    const [admin] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND is_admin = 1",
      [id]
    );
    
    if (admin.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Parse full name into first and last name
    let first_name = "";
    let last_name = "";
    
    if (full_name && typeof full_name === 'string') {
      const nameParts = full_name.trim().split(/\s+/);
      first_name = nameParts[0] || "";
      last_name = nameParts[nameParts.length - 1] || "";
    }
    
    // Update only existing columns
    await pool.execute(
      "UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?",
      [first_name, last_name, email, id]
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update admin profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// UPDATE admin password
export const updateAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  
  try {
    // Validate admin exists
    const [admin] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND is_admin = 1",
      [id]
    );
    
    if (admin.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await pool.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedNewPassword, id]
    );
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update admin password error:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
};
