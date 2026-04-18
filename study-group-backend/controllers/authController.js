// controllers/authController.js
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";
import { isAllowedWMSUEmail } from "../utils/validateWMSUEmail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// GOOGLE SIGN-IN (FIXED & WORKING)
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing ID token" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ message: "Invalid token" });

    const { email, sub: googleId, name: fullName = "User" } = payload;

    if (!email.endsWith("@wmsu.edu.ph")) {
      return res.status(400).json({ message: "Only WMSU emails are allowed" });
    }

    if (!isAllowedWMSUEmail(email)) {
      return res.status(400).json({ message: "Email not allowed (outside 5-year limit)" });
    }

    // Name parsing
    const nameParts = fullName.trim().split(/\s+/);
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

    let username = first_name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!username) username = email.split("@")[0];

    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    let user;

    if (existing.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO users 
         (first_name, middle_name, last_name, username, email, google_id, is_verified)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [first_name, middle_name || null, last_name, username, email, googleId]
      );
      const [newUser] = await pool.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
      user = newUser[0];
    } else {
      user = existing[0];
      await pool.query(
        `UPDATE users SET 
          first_name = COALESCE(first_name, ?),
          middle_name = COALESCE(middle_name, ?),
          last_name = COALESCE(last_name, ?),
          username = ?,
          google_id = COALESCE(google_id, ?),
          is_verified = 1
         WHERE id = ?`,
        [first_name, middle_name || null, last_name, username, googleId, user.id]
      );
      const [updated] = await pool.query("SELECT * FROM users WHERE id = ?", [user.id]);
      user = updated[0];
    }

    const token = generateToken(user.id);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        middle_name: user.middle_name || "",
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin || 0, // Default to 0 if undefined
        is_verified: user.is_verified || 1, // Default to 1 if undefined
        status: user.status || 'active' // Default to active if undefined
      },
    });
  } catch (err) {
    console.error("Google Auth Error:", err.message);
    return res.status(500).json({ message: "Google authentication failed" });
  }
};

// CREATE ACCOUNT (FIXED — NOW RETURNS SUCCESS PROPERLY)
export const createAccount = async (req, res) => {
  try {
    const { first_name, middle_name, last_name, username, email, password } = req.body;

    if (!email || !password || !first_name || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (!isAllowedWMSUEmail(email)) {
      return res.status(400).json({ message: "Invalid WMSU email (outside 5-year limit)" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const [result] = await pool.query(
      `INSERT INTO users 
       (first_name, middle_name, last_name, username, email, password, verification_code, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [first_name, middle_name || null, last_name, username, email, hashedPassword, verificationCode]
    );

    // Send email
    try {
      await sendEmail(
        email,
        "Verify Your Crimsons Study Squad Account",
        `<h2>Welcome ${first_name}!</h2>
         <p>Your verification code is: <strong style="font-size:18px">${verificationCode}</strong></p>
         <p>Or click here: <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/verify?email=${encodeURIComponent(email)}">Verify Email</a></p>`
      );
    } catch (emailErr) {
      console.error("Email failed but account created:", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: "Account created! Check your WMSU email for verification code.",
      userId: result.insertId
    });

  } catch (err) {
    console.error("Create Account Error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- EMAIL/PASSWORD LOGIN ----------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    console.log('Found users:', users.length);

    if (users.length === 0) {
      console.log('User not found');
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const user = users[0];
    
    console.log('User data:', {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin,
      isVerified: user.is_verified,
      hasPassword: !!user.password
    });

    if (!user.password) {
      console.log('User has no password');
      return res.status(400).json({ message: "Use Google Sign-In" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.is_verified) {
      console.log('User not verified');
      return res.status(400).json({ message: "Account not verified" });
    }

    const token = generateToken(user.id);
    res.status(200).json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_admin: user.is_admin || 0, // Default to 0 if undefined
        is_verified: user.is_verified || 1, // Default to 1 if undefined
        status: user.status || 'active' // Default to active if undefined
      } 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- ACCOUNT VERIFICATION ----------------------
export const verifyAccount = async (req, res) => {
  try {
    const { email, code } = req.body;
    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND verification_code = ?",
      [email, code]
    );

    if (users.length === 0) return res.status(400).json({ message: "Invalid verification code" });

    await pool.query(
      "UPDATE users SET is_verified = true, verification_code = NULL WHERE id = ?",
      [users[0].id]
    );

    res.status(200).json({ message: "Account verified successfully" });
  } catch (err) {
    console.error("Verify account error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ---------------------- CHECK IF GOOGLE-ONLY ACCOUNT ----------------------
export const checkGoogleAccount = async (req, res) => {
  try {
    const { email } = req.query;
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.json({ isGoogleOnly: false });

    const user = users[0];
    res.json({ isGoogleOnly: !user.password && user.google_id ? true : false });
  } catch (err) {
    console.error("Check Google account error:", err);
    res.status(500).json({ isGoogleOnly: false });
  }
};

// ---------------------- GET USER BY ID ----------------------
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.query("SELECT id, username, email, first_name, last_name, is_admin FROM users WHERE id = ?", [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = users[0];
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_admin: user.is_admin
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
