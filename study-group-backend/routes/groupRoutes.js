// routes/groupRoutes.js
import express from "express";
const router = express.Router();
import { pool } from "../config/db.js";
import { io } from "../server.js";
import { sendEmail } from "../utils/sendEmail.js";

// CREATE GROUP (with pending status)
// CREATE GROUP → PENDING FOR ADMIN APPROVAL
router.post("/create", async (req, res) => {
  const { group_name, description, created_by, size, course, topic, location } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO study_groups 
       (group_name, description, created_by, size, current_members, course, topic, location, status)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, 'pending')`,  // ← CHANGED TO 'pending'
      [group_name, description, created_by, size, course, topic, location]
    );

    const groupId = result.insertId;

    // Creator is auto-member
    await pool.query("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)", [groupId, created_by]);

    // Notify admin via socket
    const io = req.app.get("io");
    const [creator] = await pool.query("SELECT username FROM users WHERE id = ?", [created_by]);
    io.emit("newPendingGroup", {
      id: groupId,
      group_name,
      course,
      location,
      created_by: creator[0].username,
      status: "pending"
    });

    res.json({ success: true, message: "Group created! Waiting for admin approval.", groupId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create group" });
  }
});

// LIST ALL APPROVED GROUPS
router.get("/list", async (req, res) => {
  try {
    const [groups] = await pool.query(`
      SELECT g.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM study_groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.status = 'approved'
      ORDER BY g.created_at DESC
    `);

    // Add current_members count
    for (let group of groups) {
      const [count] = await pool.query("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?", [group.id]);
      group.current_members = count[0].count;
    }

    res.json({ data: groups });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL GROUPS (including pending/declined) - FOR CREATORS ONLY
router.get("/all", async (req, res) => {
  try {
    const [groups] = await pool.query(`
      SELECT g.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM study_groups g
      JOIN users u ON g.created_by = u.id
      ORDER BY g.created_at DESC
    `);

    for (let group of groups) {
      const [members] = await pool.query("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?", [group.id]);
      group.current_members = members[0].count || 0;
    }

    res.json({ data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/join", async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    // 1. Check if group exists
    const [group] = await pool.query("SELECT * FROM study_groups WHERE id = ?", [groupId]);
    if (!group.length) return res.status(404).json({ message: "Group not found" });

    const groupData = group[0];

    // 2. Prevent duplicate join requests
    const [existing] = await pool.query(
      "SELECT * FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );
    if (existing.length > 0) return res.status(400).json({ message: "Already sent or member" });

    // 3. Add as pending member
    const [insert] = await pool.query(
      "INSERT INTO group_members (group_id, user_id, status) VALUES (?, ?, 'pending')",
      [groupId, userId]
    );

    // 4. Get username of requester
    const [user] = await pool.query("SELECT username FROM users WHERE id = ?", [userId]);
    const username = user[0]?.username || "Someone";

    // 5. Save notification for creator
    const [notifResult] = await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, requester_id, created_at)
       VALUES (?, ?, ?, 'join_request', ?, ?, NOW())`,
      [
        groupData.created_by,
        "New Join Request!",
        `${username} wants to join "${groupData.group_name}"`,
        groupId,
        userId
      ]
    );

    const notifId = notifResult.insertId;

    // 6. Emit in real-time to creator
    const io = req.app.get("io");
    io.to(`user_${groupData.created_by}`).emit("notification", {
      id: notifId,
      user_id: groupData.created_by,
      title: "New Join Request!",
      message: `${username} wants to join "${groupData.group_name}"`,
      type: "join_request",
      related_id: groupId,
      requester_id: userId,
      is_read: 0,
      is_archived: 0,
      is_deleted: 0,
      created_at: new Date().toISOString()
    });

    // Emit real-time event
    if (io) {
      // Get group details for the notification
      const [groupData] = await pool.query("SELECT group_name FROM groups WHERE id = ?", [groupId]);
      const [userData] = await pool.query("SELECT username FROM users WHERE id = ?", [userId]);
      
      io.emit("join_request_sent", {
        group_id: groupId,
        group_name: groupData[0]?.group_name || "Unknown Group",
        requester_id: userId,
        requester_name: userData[0]?.username || "Unknown User"
      });
    }

    res.json({ message: "Join request sent!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET member status
router.get("/member-status/:groupId/:userId", async (req, res) => {
  const { groupId, userId } = req.params;
  try {
    const [row] = await pool.query(
      "SELECT status FROM group_members WHERE group_id = ? AND user_id = ?",
      [groupId, userId]
    );
    res.json({ status: row.length > 0 ? row[0].status : "none" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/approve", async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const io = req.app.get("io");

    // 1. Update group_members to approved
    await pool.query(
      "UPDATE group_members SET status = 'approved' WHERE group_id = ? AND user_id = ? AND status = 'pending'",
      [groupId, userId]
    );

    // 2. Increment current_members in study_groups
    await pool.query("UPDATE study_groups SET current_members = current_members + 1 WHERE id = ?", [groupId]);

    // 3. Get group & user info
    const [groupData] = await pool.query("SELECT group_name, created_by FROM study_groups WHERE id = ?", [groupId]);
    const [member] = await pool.query("SELECT username FROM users WHERE id = ?", [userId]);

    const groupName = groupData[0].group_name;
    const creatorId = groupData[0].created_by;
    const memberName = member[0].username;

    // 4. Notification to approved member
    const [notifMember] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
       VALUES (?, ?, ?, 'general', ?, NOW())`,
      [userId, "You're In!", `You have been approved to join "${groupName}"!`, groupId]
    );

    const [notifMemberRows] = await pool.query("SELECT id, user_id, title, message, type, related_id, created_at FROM notifications WHERE id = ?", [notifMember.insertId]);
    io.to(`user_${userId}`).emit("notification", {
      ...notifMemberRows[0],
      created_at: new Date(notifMemberRows[0].created_at).toISOString()
    });

    // 4b. Send email notification to approved member
    try {
      const [memberEmail] = await pool.query("SELECT email FROM users WHERE id = ?", [userId]);
      if (memberEmail.length > 0) {
        const emailMessage = `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2 style="color: #800000;">Crimsons Study Squad</h2>
            <p>Hi ${memberName},</p>
            <p>Great news! Your request to join the study group "${groupName}" has been <strong style="color: #008000;">APPROVED</strong>!</p>
            <p>You can now access the group and start collaborating with other members.</p>
            <p>Visit your dashboard to see all your approved study groups:</p>
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/my-study-groups" style="color:#800000; text-decoration:underline; font-weight:bold;">View My Study Groups</a>
            <br/><br/>
            <p>– Crimsons Study Squad Team</p>
          </div>
        `;

        await sendEmail(memberEmail[0].email, "Your Study Group Was Approved!", emailMessage);
        console.log(`✅ Approval email sent to: ${memberEmail[0].email}`);
      }
    } catch (emailErr) {
      console.error("Failed to send approval email:", emailErr);
    }

    // 5. Notification to creator
    const [notifCreator] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
       VALUES (?, ?, ?, 'general', ?, NOW())`,
      [creatorId, "Member Approved", `You approved ${memberName} to join "${groupName}"`, groupId]
    );

    const [notifCreatorRows] = await pool.query("SELECT id, user_id, title, message, type, related_id, created_at FROM notifications WHERE id = ?", [notifCreator.insertId]);
    io.to(`user_${creatorId}`).emit("notification", {
      ...notifCreatorRows[0],
      created_at: new Date(notifCreatorRows[0].created_at).toISOString()
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


router.post("/decline", async (req, res) => {
  const { groupId, userId } = req.body;

  try {
    const io = req.app.get("io");

    // 1. Remove pending member
    await pool.query(
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ? AND status = 'pending'",
      [groupId, userId]
    );

    // 2. Get group & user info
    const [groupData] = await pool.query("SELECT group_name, created_by FROM study_groups WHERE id = ?", [groupId]);
    const [member] = await pool.query("SELECT username FROM users WHERE id = ?", [userId]);

    const groupName = groupData[0].group_name;
    const creatorId = groupData[0].created_by;
    const memberName = member[0].username;

    // 3. Notification to member
    const [notifMember] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
       VALUES (?, ?, ?, 'general', ?, NOW())`,
      [userId, "Request Declined", `Your request to join "${groupName}" was declined.`, groupId]
    );

    const [notifMemberRows] = await pool.query("SELECT id, user_id, title, message, type, related_id, created_at FROM notifications WHERE id = ?", [notifMember.insertId]);
    io.to(`user_${userId}`).emit("notification", {
      ...notifMemberRows[0],
      created_at: new Date(notifMemberRows[0].created_at).toISOString()
    });

    // 4. Notification to creator
    const [notifCreator] = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, created_at)
       VALUES (?, ?, ?, 'general', ?, NOW())`,
      [creatorId, "Request Declined", `You declined ${memberName}'s request to join "${groupName}"`, groupId]
    );

    const [notifCreatorRows] = await pool.query("SELECT id, user_id, title, message, type, related_id, created_at FROM notifications WHERE id = ?", [notifCreator.insertId]);
    io.to(`user_${creatorId}`).emit("notification", {
      ...notifCreatorRows[0],
      created_at: new Date(notifCreatorRows[0].created_at).toISOString()
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});



// GET PENDING REQUESTS FOR CREATOR
router.get("/pending-members/:creatorId", async (req, res) => {
  const { creatorId } = req.params;
  try {
    const [groups] = await pool.query("SELECT id FROM study_groups WHERE created_by = ?", [creatorId]);
    const pending = {};

    for (let g of groups) {
      const [requests] = await pool.query(`
        SELECT u.id as userId, u.username, u.first_name, u.last_name
        FROM group_join_requests gjr
        JOIN users u ON gjr.user_id = u.id
        WHERE gjr.group_id = ? AND gjr.status = 'pending'
      `, [g.id]);
      if (requests.length > 0) pending[g.id] = requests;
    }

    res.json({ data: pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET USER'S JOINED GROUPS (for My Study Groups page)
router.get("/my-joined/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [groups] = await pool.query(`
      SELECT g.*, u.first_name, u.last_name
      FROM study_groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON g.created_by = u.id
      WHERE gm.user_id = ? AND g.status = 'approved'
    `, [userId]);
    res.json({ data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET USER'S CREATED GROUPS (for "Your Created Groups" sidebar in dashboard)
router.get("/my-groups/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [groups] = await pool.query(`
      SELECT g.*, u.first_name, u.last_name, CONCAT(u.first_name, ' ', u.last_name) AS creator_name
      FROM study_groups g
      JOIN users u ON g.created_by = u.id
      WHERE g.created_by = ? AND g.status = 'approved'
      ORDER BY g.created_at DESC
    `, [userId]);

    for (let group of groups) {
      const [count] = await pool.query("SELECT COUNT(*) as count FROM group_members WHERE group_id = ?", [group.id]);
      group.current_members = count[0].count;
    }

    res.json({ data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// LEAVE GROUP
router.post("/leave", async (req, res) => {
  const { userId, groupId } = req.body;

  if (!userId || !groupId) return res.status(400).json({ message: "userId and groupId are required" });

  try {
    // Check if user is a member
    const [member] = await pool.query(
      "SELECT * FROM group_members WHERE user_id = ? AND group_id = ?",
      [userId, groupId]
    );
    if (member.length === 0) return res.status(404).json({ message: "User is not a member of this group" });

    // Remove from group_members
    await pool.query("DELETE FROM group_members WHERE user_id = ? AND group_id = ?", [userId, groupId]);

    // Optional: decrement current_members in groups
    await pool.query("UPDATE study_groups SET current_members = current_members - 1 WHERE id = ?", [groupId]);

    res.json({ message: "You have left the group successfully." });
  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;