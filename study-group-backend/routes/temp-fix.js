import express from 'express';
import bcryptjs from 'bcryptjs';
import { pool } from '../config/db.js';

const router = express.Router();

// Temporary endpoint to fix admin password
router.post('/fix-admin-password', async (req, res) => {
  try {
    const email = 'admin@wmsu.edu.ph';
    const password = 'test123';
    
    // Generate new password hash
    const hash = await bcryptjs.hash(password, 10);
    
    // Update admin password
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, email]
    );
    
    res.json({ 
      message: 'Admin password fixed!',
      hash: hash,
      rowsAffected: result.affectedRows
    });
    
  } catch (err) {
    console.error('Error fixing admin password:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
