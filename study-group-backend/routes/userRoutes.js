import express from "express";
import multer from "multer";
import path from "path";
import { verifyToken } from "../middleware/authMiddleware.js";
import { pool } from "../config/db.js";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: "uploads/profile_photos",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Serve uploads
router.use("/uploads", express.static("uploads"));

// GET current user
// GET current user — DIAGNOSTIC VERSION (copy-paste this)
router.get("/me", verifyToken, async (req, res) => {
  console.log("verifyToken passed — req.user:", req.user); // ← MUST SEE { id: 25 }

  try {
    // First: simple test query
    const [test] = await pool.query("SELECT id, first_name FROM users WHERE id = ?", [req.user.id]);
    console.log("Simple query result:", test);

    if (!test || test.length === 0) {
      return res.status(404).json({ message: "User not found — wrong ID?" });
    }

    // Second: full safe query
    const [results] = await pool.query(
      `SELECT 
         id,
         COALESCE(first_name, '') AS first_name,
         COALESCE(middle_name, '') AS middle_name,
         COALESCE(last_name, '') AS last_name,
         username,
         email,
         COALESCE(bio, '') AS bio,
         profile_photo
       FROM users 
       WHERE id = ?`,
      [req.user.id]
    );

    const user = results[0];
    console.log("Full user fetched:", user);

    if (user.profile_photo) {
      const protocol = req.protocol;
      const host = req.get('host');
      user.profile_photo = `${protocol}://${host}/uploads/profile_photos/${user.profile_photo}`;
    }

    res.json(user);
  } catch (err) {
    console.error("500 ERROR IN /me ROUTE:", err);
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    res.status(500).json({ 
      message: "Database crashed", 
      error: err.message,
      code: err.code 
    });
  }
});

// PUT update user
router.put("/me", verifyToken, upload.single("profile_photo"), async (req, res) => {
  const { first_name, middle_name, last_name, username, bio } = req.body;
  const profile_photo = req.file ? req.file.filename : null;

  try {
    let sql = "UPDATE users SET first_name=?, middle_name=?, last_name=?, username=?, bio=?";
    const values = [first_name, middle_name, last_name, username, bio];

    if (profile_photo) {
      sql += ", profile_photo=?";
      values.push(profile_photo);
    }

    sql += " WHERE id=?";
    values.push(req.user.id);

    await pool.query(sql, values);

    const [updatedResults] = await pool.query(
      "SELECT id, first_name, middle_name, last_name, username, email, bio, profile_photo FROM users WHERE id=?",
      [req.user.id]
    );

    const updatedUser = updatedResults[0];
    if (updatedUser.profile_photo) {
      const protocol = req.protocol;
      const host = req.get('host');
      updatedUser.profile_photo = `${protocol}://${host}/uploads/profile_photos/${updatedUser.profile_photo}`;
    }

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;
