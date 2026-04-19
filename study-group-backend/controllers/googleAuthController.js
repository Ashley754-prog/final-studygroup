import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";   // ✅ FIXED IMPORT
import { isAllowedWMSUEmail } from "../utils/validateWMSUEmail.js";

// Google Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;
    const fullName = payload.name || "User";

    // Email validation
    if (!email.endsWith("@wmsu.edu.ph")) {
      return res.status(400).json({ message: "Only WMSU emails are allowed." });
    }

    if (!isAllowedWMSUEmail(email)) {
      return res.status(400).json({ message: "WMSU email not allowed." });
    }

    // Proper name splitting
    const nameParts = fullName.trim().split(" ");
    let first_name = nameParts[0] || "";
    let middle_name = "";
    let last_name = nameParts[nameParts.length - 1] || "";

    if (nameParts.length === 4) {
      first_name = `${nameParts[0]} ${nameParts[1]}`;
      middle_name = nameParts[2];
      last_name = nameParts[3];
    } else if (nameParts.length === 3) {
      first_name = nameParts[0];
      middle_name = nameParts[1];
      last_name = nameParts[2];
    } else if (nameParts.length === 2) {
      first_name = nameParts[0];
      last_name = nameParts[1];
    }

    // Username cleanup
    let username = first_name.split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!username) username = email.split("@")[0];

    // Check existing user
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    let user;

    if (existingUsers.length === 0) {
      // Don't auto-create accounts - require manual account creation first
      return res.status(400).json({ 
        success: false,
        message: "No account found with this Google email. Please create an account first using the Create Account page." 
      });
    }
    
    user = existingUsers[0];

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(400).json({ 
        success: false,
        message: "Account has been banned. Please contact the administrator." 
      });
    }

    await pool.query(
      `UPDATE users 
      SET first_name = COALESCE(first_name, ?),
          middle_name = COALESCE(middle_name, ?),
          last_name = COALESCE(last_name, ?),
          username = COALESCE(username, ?),
          google_id = COALESCE(google_id, ?),
          is_verified = 1
      WHERE id = ?`,
      [first_name, middle_name || null, last_name, username, googleId, user.id]
    );

    const [updated] = await pool.query(
      "SELECT * FROM users WHERE id = ?",
      [user.id]
    );
    user = updated[0];

    // JWT Token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
        status: user.status
      },
    });

  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Authentication failed" });
  }
};
