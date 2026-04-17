import { pool } from "./config/db.js";

(async () => {
  try {
    console.log("Checking and fixing admin users...");
    
    // Make sure user ID 35 is admin
    await pool.execute("UPDATE users SET is_admin = 1 WHERE id = 35");
    console.log("User 35 is now admin");
    
    // Check all users
    const [users] = await pool.execute("SELECT id, username, email, is_admin FROM users ORDER BY id");
    console.log("All users:");
    console.table(users);
    
    // Test admin profile fetch
    const [admin] = await pool.execute(
      `SELECT id, username, email, first_name, last_name, middle_name, 
              is_admin, is_verified, created_at, status
       FROM users WHERE id = 35 AND is_admin = 1`
    );
    
    if (admin.length > 0) {
      console.log("Admin profile test - SUCCESS");
      console.log("Admin data:", admin[0]);
    } else {
      console.log("Admin profile test - FAILED");
    }
    
  } catch (err) {
    console.error("Error:", err);
  }
})();
