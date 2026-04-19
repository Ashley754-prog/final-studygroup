// controllers/admin/userAdminController.js
import { pool } from "../../config/db.js";

// GET ALL USERS
export const getAdminUserList = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, first_name, middle_name, last_name, username, email, is_admin, status, is_verified, created_at FROM users"
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
  const { id } = req.params;
  const { deleteData = false } = req.query; // deleteData=false = account only, true = everything

  if (!id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.query("START TRANSACTION");

    if (deleteData === 'true') {
      // FULL DELETION - Delete everything (original implementation)
      // Delete user's messages
      await connection.execute("DELETE FROM group_messages WHERE sender_id = ?", [id]);
      
      // Delete user's group memberships
      await connection.execute("DELETE FROM group_members WHERE user_id = ?", [id]);
      
      // Delete user's notifications
      await connection.execute("DELETE FROM notifications WHERE user_id = ?", [id]);
      
      // Delete announcements for user's created groups (handle foreign key constraint)
      const [userGroups] = await connection.execute("SELECT id FROM study_groups WHERE created_by = ?", [id]);
      for (const group of userGroups) {
        await connection.execute("DELETE FROM announcements WHERE group_id = ?", [group.id]);
        // Delete group members for this group
        await connection.execute("DELETE FROM group_members WHERE group_id = ?", [group.id]);
        // Delete group messages for this group
        await connection.execute("DELETE FROM group_messages WHERE group_id = ?", [group.id]);
        // Delete join requests for this group
        await connection.execute("DELETE FROM group_join_requests WHERE group_id = ?", [group.id]);
        // Delete group schedules for this group (table is called 'schedules')
        await connection.execute("DELETE FROM schedules WHERE groupId = ?", [group.id]);
      }
      
      // Now delete user's created study groups
      await connection.execute("DELETE FROM study_groups WHERE created_by = ?", [id]);
      
      // Finally delete the user
      await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    } else {
      // ACCOUNT ONLY DELETION - Keep groups and data, just remove user account
      // Reassign user's groups to the oldest member or admin
      const [userGroups] = await connection.execute("SELECT id, group_name FROM study_groups WHERE created_by = ?", [id]);
      
      for (const group of userGroups) {
        // Find oldest member to reassign ownership
        const [oldestMember] = await connection.execute(
          "SELECT user_id FROM group_members WHERE group_id = ? ORDER BY created_at ASC LIMIT 1", 
          [group.id]
        );
        
        if (oldestMember.length > 0) {
          // Reassign to oldest member
          await connection.execute("UPDATE study_groups SET created_by = ? WHERE id = ?", [oldestMember[0].user_id, group.id]);
        } else {
          // No members, keep group but mark as orphaned
          await connection.execute("UPDATE study_groups SET created_by = NULL WHERE id = ?", [group.id]);
        }
      }
      
      // Remove user from all groups they joined
      await connection.execute("DELETE FROM group_members WHERE user_id = ?", [id]);
      
      // Delete user's notifications
      await connection.execute("DELETE FROM notifications WHERE user_id = ?", [id]);
      
      // Mark user as deleted but keep record for audit
      // Use deleted_ prefix to maintain NOT NULL constraints
      // Use 'banned' status since 'deleted' is not in the ENUM
      await connection.execute(
        "UPDATE users SET email = CONCAT('deleted_', id, '_', email), username = CONCAT('deleted_', id, '_', username), status = 'banned' WHERE id = ?", 
        [id]
      );
    }
    
    // Commit transaction
    await connection.query("COMMIT");
    
    const message = deleteData === 'true' 
      ? "User and all their data deleted successfully"
      : "User account deleted, groups and data preserved";
    
    res.json({ message });
  } catch (err) {
    // Rollback on error
    await connection.query("ROLLBACK");
    console.error("DB ERROR:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  } finally {
    connection.release();
  }
};

// RESTORE USER
export const restoreUser = async (req, res) => {
  const { id } = req.params;

  try {
    // First get current user data to see what needs to be restored
    const [currentUser] = await pool.execute("SELECT email, username FROM users WHERE id = ?", [id]);
    
    if (currentUser.length > 0) {
      const user = currentUser[0];
      let originalEmail = user.email;
      let originalUsername = user.username;
      
      // Remove deleted_ prefix if it exists
      if (originalEmail.startsWith('deleted_')) {
        const parts = originalEmail.split('_');
        if (parts.length >= 3) {
          originalEmail = parts.slice(2).join('_');
        }
      }
      
      if (originalUsername.startsWith('deleted_')) {
        const parts = originalUsername.split('_');
        if (parts.length >= 3) {
          originalUsername = parts.slice(2).join('_');
        }
      }
      
      // Restore both status and original email/username
      await pool.execute(
        "UPDATE users SET status = 'active', email = ?, username = ? WHERE id = ?",
        [originalEmail, originalUsername, id]
      );
    } else {
      // Fallback - just restore status
      await pool.execute(
        "UPDATE users SET status = 'active' WHERE id = ?",
        [id]
      );
    }

    res.json({ message: "User restored successfully!" });
  } catch (err) {
    console.error("Restore user error:", err);
    res.status(500).json({ message: "Failed to restore user", error: err.message });
  }
};
