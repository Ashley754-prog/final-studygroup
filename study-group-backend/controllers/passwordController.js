import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0)
      return res.status(404).json({ message: "No user found with this email" });

    const user = users[0];

    // Block Google-only users (no password set)
    if (!user.password && user.google_id) {
      return res.status(400).json({
        type: "google",
        message: "You signed up using Google. Please continue with Google Sign-In.",
      });
    }

    // Allow hybrid users (both Google and manual login) and manual-only users
    // They have a password, so they can reset it

    // ✅ Manual account — continue with reset logic
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expireTime = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?",
      [resetTokenHash, expireTime, user.id]
    );

    const resetURL = `http://localhost:5173/reset-password/${resetToken}?email=${encodeURIComponent(user.email)}`;

    const message = `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2 style="color: #800000;">Crimsons Study Squad</h2>
        <p>Hi ${user.username},</p>
        <p>We received a request to reset your password. Copy the link below and open it in the same tab to reset your password:</p>
        <a href="${resetURL}" style="color:#800000; text-decoration:underline; font-weight:bold;">Reset Password</a>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <br/>
        <p>– Crimsons Study Squad Team</p>
      </div>
    `;

    await sendEmail(user.email, "Reset Your Password", message);

    res.json({ message: "Password reset email sent! Check your inbox." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [users] = await pool.query(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expire > NOW()",
      [tokenHash]
    );

    if (users.length === 0)
      return res.status(400).json({ message: "Invalid or expired token" });

    const user = users[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    res.json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};
