// controllers/admin/userAdminController.js
import { pool } from "../../config/db.js";

// GET ALL USERS
export const getAdminUserList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, first_name, middle_name, last_name, username, email, is_admin, status FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

// TOGGLE ADMIN ROLE
export const toggleAdminRole = async (req, res) => {
  const userId = req.params.id;
  try {
    const [userRows] = await pool.execute(
      "SELECT is_admin FROM users WHERE id = ?",
      [userId]
    );

    if (userRows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const newRole = userRows[0].is_admin ? 0 : 1;
    await pool.execute("UPDATE users SET is_admin = ? WHERE id = ?", [newRole, userId]);

    res.json({ message: "User role updated", userId, is_admin: newRole });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
};

// DELETE USER (any status) - with cascading delete
export const deleteUserById = async (req, res) => {
  const userId = req.params.id;
  try {
    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) return res.status(404).json({ message: "User not found" });

    // Start transaction for cascading delete
    await pool.query("START TRANSACTION");

    try {
      // Delete user's messages
      await pool.execute("DELETE FROM group_messages WHERE sender_id = ?", [userId]);
      
      // Delete user's group memberships
      await pool.execute("DELETE FROM group_members WHERE user_id = ?", [userId]);
      
      // Delete user's notifications
      await pool.execute("DELETE FROM notifications WHERE user_id = ?", [userId]);
      
      // Delete user's created study groups (this will cascade to delete group members, messages, etc.)
      await pool.execute("DELETE FROM study_groups WHERE created_by = ?", [userId]);
      
      // Finally delete the user
      await pool.execute("DELETE FROM users WHERE id = ?", [userId]);
      
      // Commit transaction
      await pool.query("COMMIT");
      
      res.json({ message: "User deleted successfully" });
    } catch (deleteErr) {
      // Rollback on error
      await pool.query("ROLLBACK");
      throw deleteErr;
    }
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};
