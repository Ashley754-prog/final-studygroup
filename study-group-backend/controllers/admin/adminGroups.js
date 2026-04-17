// study-group-backend/controllers/admin/adminGroups.js
import { pool } from "../../config/db.js";
import { sendEmail } from "../../utils/admin/email.js";
import { getIO } from "../../utils/admin/socket.js";

// GET all groups
export const getGroups = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM study_groups ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE a group (status + remarks)
export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    // Update group in DB
    await pool.query(
      "UPDATE study_groups SET status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, remarks, id]
    );

    // Fetch creator email and group name
    const [rows] = await pool.query(
      `SELECT u.id AS user_id, u.email, g.group_name 
       FROM study_groups g 
       JOIN users u ON g.created_by = u.id 
       WHERE g.id = ?`,
      [id]
    );

    if (rows.length > 0) {
      const { user_id, email, group_name } = rows[0];

      if (status === "approved") {
        // Insert notification
        const [insertRes] = await pool.query(
          `INSERT INTO notifications (user_id, title, message)
           VALUES (?, ?, ?)`,
          [user_id, "Group Approved", `Your group "${group_name}" has been approved by the admin.`]
        );

        // Emit real-time event
        try {
          const io = getIO();
          io.to(`user_${user_id}`).emit("notification", {
            id: insertRes.insertId,
            user_id,
            title: "Group Approved",
            message: `Your group "${group_name}" has been approved by the admin.`,
            is_read: 0,
            is_starred: 0,
            is_archived: 0,
            created_at: new Date()
          });
        } catch (e) {
          // socket not initialized or other error — ignore but log
          console.warn("Socket emit failed:", e.message);
        }

        // Send email
        await sendEmail({
          to: email,
          subject: "Your study group was approved!",
          text: `Your group "${group_name}" has been approved. You can now see it in your dashboard.`,
        });

      } else if (status === "declined") {
        const [insertRes] = await pool.query(
          `INSERT INTO notifications (user_id, title, message)
           VALUES (?, ?, ?)`,
          [user_id, "Group Declined", `Your group "${group_name}" was declined. Reason: ${remarks}`]
        );

        try {
          const io = getIO();
          io.to(`user_${user_id}`).emit("notification", {
            id: insertRes.insertId,
            user_id,
            title: "Group Declined",
            message: `Your group "${group_name}" was declined. Reason: ${remarks}`,
            is_read: 0,
            is_starred: 0,
            is_archived: 0,
            created_at: new Date()
          });
        } catch (e) {
          console.warn("Socket emit failed:", e.message);
        }

        await sendEmail({
          to: email,
          subject: "Your study group was declined",
          text: `Your group "${group_name}" was declined. Reason: ${remarks}`,
        });
      }
    }

    res.json({ message: "Group updated, notification + email handled." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE a group
export const deleteGroup = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM study_groups WHERE id = ?", [id]);
    res.json({ message: "Group deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
