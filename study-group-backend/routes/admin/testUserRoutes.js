import express from "express";
import { pool } from "../../config/db.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Create test user endpoint
router.post("/create-test-user", async (req, res) => {
  try {
    // Check if admin (you can modify this security check as needed)
    const { adminKey } = req.body;
    if (adminKey !== "create_test_user_2026") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('minty_fresh', 10);
    
    // Insert the test user
    const [result] = await pool.execute(
      `INSERT INTO users (
        first_name, 
        middle_name, 
        last_name, 
        username, 
        email, 
        password, 
        bio, 
        profile_photo, 
        is_verified, 
        role, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        'Minty',
        'Super', 
        'Fresh',
        'minty_min',
        'hz202300123@wmsu.edu.ph',
        hashedPassword,
        'Test user for user-to-user interactions',
        null,
        1, // is_verified = true (approved)
        'user', // role = user
      ]
    );
    
    res.json({ 
      success: true,
      message: 'Test user created successfully!',
      user: {
        id: result.insertId,
        username: 'minty_min',
        email: 'hz202300123@wmsu.edu.ph',
        password: 'minty_fresh',
        status: 'Approved (is_verified = 1)'
      }
    });
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      // Update existing user to be approved
      await pool.execute(
        `UPDATE users SET is_verified = 1 WHERE username = 'minty_min' OR email = 'hz202300123@wmsu.edu.ph'`
      );
      
      res.json({ 
        success: true,
        message: 'Test user already exists. Updated to approved status!',
        user: {
          username: 'minty_min',
          email: 'hz202300123@wmsu.edu.ph',
          password: 'minty_fresh',
          status: 'Approved (is_verified = 1)'
        }
      });
    } else {
      console.error('Error creating test user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating test user',
        error: error.message 
      });
    }
  }
});

export default router;
