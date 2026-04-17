import express from "express";
import { pool } from "../../config/db.js";
import { sendNotification } from "../../controllers/admin/notificationsController.js";
import { sendEmail } from "../../utils/sendEmail.js";

const router = express.Router();

// APPROVE ROUTE
router.patch("/approve/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE study_groups SET status='approved', updated_at=NOW() WHERE id=?",
      [id]
    );

    const [rows] = await pool.query(
      `SELECT u.email, g.group_name, g.created_by 
       FROM study_groups g 
       JOIN users u ON g.created_by = u.id 
       WHERE g.id=?`,
      [id]
    );

    if (rows.length > 0) {
      const { email, group_name, created_by } = rows[0];

      // Send in-app notification
      await sendNotification(
        created_by,
        "Your Study Group was APPROVED!",
        `Great news! Your group "${group_name}" has been approved and is now visible to all students. Start inviting members!`
      );

      // Send email notification
      try {
        const emailMessage = `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2 style="color: #800000;">Crimsons Study Squad</h2>
            <p>Hi,</p>
            <p>Great news! Your study group <strong style="color: #008000;">"${group_name}"</strong> has been <strong style="color: #008000;">APPROVED</strong> by the admin!</p>
            <p>Your group is now visible to all WMSU students and they can start joining your study group.</p>
            <p>You can now:</p>
            <ul style="margin-left: 20px;">
              <li>View your group in your dashboard</li>
              <li>Accept member join requests</li>
              <li>Schedule study sessions</li>
              <li>Communicate with group members</li>
            </ul>
            <p>Visit your dashboard to manage your group:</p>
            <a href="http://localhost:5173/group-creator" style="color:#800000; text-decoration:underline; font-weight:bold;">Manage My Study Groups</a>
            <br/><br/>
            <p>Thank you for creating a study group to help fellow students!</p>
            <p>Best regards,<br/>Crimsons Study Squad Team</p>
          </div>
        `;

        await sendEmail(email, "Your Study Group Was Approved! - Crimsons Study Squad", emailMessage);
        console.log(`Group approval email sent to: ${email}`);
      } catch (emailErr) {
        console.error("Failed to send group approval email:", emailErr);
      }
    }

    // Optional: tell all admins to refresh
    const io = req.app.get("io");
    io.emit("groupStatusChanged");
    io.emit("groupUpdated");

    res.json({ success: true, message: "Group approved and notification sent" });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DECLINE ROUTE
router.patch("/decline/:id", async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  try {
    await pool.query(
      "UPDATE study_groups SET status='declined', remarks=?, updated_at=NOW() WHERE id=?",
      [remarks || "No remarks", id]
    );

    const [rows] = await pool.query(
      `SELECT u.email, g.group_name, g.created_by 
       FROM study_groups g 
       JOIN users u ON g.created_by = u.id 
       WHERE g.id=?`,
      [id]
    );

    if (rows.length > 0) {
      const { email, group_name, created_by } = rows[0];

      // Send in-app notification
      await sendNotification(
        created_by,
        "Your Study Group was Declined",
        `We're sorry, but your group "${group_name}" was declined.\n\nReason: ${remarks || "No remarks provided"}\n\nYou can edit and resubmit!`
      );

      // Send email notification
      try {
        const emailMessage = `
          <div style="font-family: Arial, sans-serif; line-height:1.6;">
            <h2 style="color: #800000;">Crimsons Study Squad</h2>
            <p>Hi,</p>
            <p>We're sorry to inform you that your study group <strong style="color: #dc2626;">"${group_name}"</strong> has been <strong style="color: #dc2626;">DECLINED</strong> by the admin.</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Reason for decline:</strong></p>
              <p style="margin: 5px 0 0 0;">${remarks || "No specific reason provided"}</p>
            </div>
            
            <p>Don't worry! You can:</p>
            <ul style="margin-left: 20px;">
              <li>Edit your group details based on the feedback</li>
              <li>Address the admin's concerns</li>
              <li>Resubmit your group for approval</li>
            </ul>
            
            <p>To edit and resubmit your group:</p>
            <a href="http://localhost:5173/edit-group/${id}" style="color:#800000; text-decoration:underline; font-weight:bold;">Edit Your Group: "${group_name}"</a>
            <br/><br/>
            <p style="font-size: 12px; color: #666;">Or view all your groups: <a href="http://localhost:5173/group-creator" style="color:#800000; text-decoration:underline;">Manage My Study Groups</a></p>
            
            <br/><br/>
            <p>If you have any questions about the decline reason, feel free to contact the admin team.</p>
            <p>Best regards,<br/>Crimsons Study Squad Team</p>
          </div>
        `;

        await sendEmail(email, "Your Study Group Was Declined - Crimsons Study Squad", emailMessage);
        console.log(`Group decline email sent to: ${email}`);
      } catch (emailErr) {
        console.error("Failed to send group decline email:", emailErr);
      }
    }

    const io = req.app.get("io");
    io.emit("groupStatusChanged");

    res.json({ success: true, message: "Group declined and notification sent" });
  } catch (err) {
    console.error("Decline error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------------
// GET all groups
router.get("/list", async (req, res) => {
  try {
    const [groups] = await pool.query("SELECT * FROM study_groups ORDER BY created_at DESC");
    res.json({ data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
