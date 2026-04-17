import { pool } from "./config/db.js";

(async () => {
  try {
    console.log("=== Checking Admin Login Issue ===");
    
    // Check admin user in database
    const [admin] = await pool.execute(
      "SELECT id, username, email, is_admin, password FROM users WHERE email = ?",
      ["admin@wmsu.edu.ph"]
    );
    
    if (admin.length === 0) {
      console.log("Admin user not found in database!");
      return;
    }
    
    console.log("Admin user found in database:");
    console.table(admin[0]);
    
    // Check if password "test123" matches
    const bcrypt = await import("bcryptjs");
    const isPasswordValid = await bcrypt.default.compare("test123", admin[0].password);
    console.log("Password 'test123' is valid:", isPasswordValid);
    
    // Check all users
    const [allUsers] = await pool.execute(
      "SELECT id, username, email, is_admin FROM users ORDER BY id"
    );
    console.log("All users:");
    console.table(allUsers);
    
  } catch (err) {
    console.error("Error:", err);
  }
})();
