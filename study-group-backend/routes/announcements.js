import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  const { groupId, userId, title, description } = req.body;

  if (!groupId || !userId || !title || !description) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Save to DB
    const [result] = await pool.execute(
      `INSERT INTO announcements (group_id, user_id, title, description, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [groupId, userId, title, description]
    );

    const [newAnnouncement] = await pool.execute(
      `SELECT a.id, a.group_id, a.user_id, a.title, a.description, a.created_at,
              u.username AS author
       FROM announcements a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [result.insertId]
    );

    // Emit via socket.io to group room
    const io = req.app.get("io");
    io.to(`group_${groupId}`).emit("newAnnouncement", newAnnouncement[0]);

    res.status(201).json({ message: "Announcement posted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error", err });
  }
});

// routes/announcements.js
router.get("/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT a.*, u.username AS author_name 
       FROM announcements a 
       JOIN users u ON a.user_id = u.id
       WHERE a.group_id = ? 
       ORDER BY a.created_at DESC`,
      [groupId]
    );
    res.json({ announcements: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
});

// Delete announcement
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const [result] = await pool.execute(
      "DELETE FROM announcements WHERE id = ?",
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    
    res.json({ message: "Announcement deleted successfully" });
  } catch (err) {
    console.error("Delete announcement error:", err);
    res.status(500).json({ message: "Failed to delete announcement" });
  }
});

export default router;
