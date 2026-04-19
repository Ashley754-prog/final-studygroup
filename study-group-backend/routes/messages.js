import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// GET all messages for a group
router.get("/:groupId/messages", async (req, res) => {
  const groupId = parseInt(req.params.groupId, 10);
  try {
    const [messages] = await pool.execute(
      `SELECT 
         gm.id, 
         gm.sender_id,
         gm.text, 
         gm.file_link AS fileLink,
         gm.time,
         u.username AS sender_name
       FROM group_messages gm
       JOIN users u ON gm.sender_id = u.id
       WHERE gm.group_id = ?
       ORDER BY gm.time ASC`,
      [groupId]
    );
    // Format time to Philippine timezone before sending
    const formattedMessages = messages.map(msg => ({
      ...msg,
      time: msg.time ? (() => {
        const date = new Date(msg.time);
        // The database stores UTC time, but JavaScript interprets it as local time
        // We need to add 16 hours to compensate for the timezone conversion issue
        const phTime = new Date(date.getTime() + (16 * 60 * 60 * 1000));
        return phTime.toLocaleTimeString('en-US', {
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        });
      })() : ""
    }));
    
    res.json({ messages: formattedMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

export default router;