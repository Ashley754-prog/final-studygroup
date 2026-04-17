import { pool } from "./config/db.js";
import bcrypt from "bcryptjs";

const addTestUser = async () => {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password, first_name, last_name, is_verified, created_at) 
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [
        'minty_min',
        'minty@example.com', 
        hashedPassword,
        'Minty',
        'Super Fresh'
      ]
    );
    
    console.log('✅ Test user added successfully!');
    console.log('Username: minty_min');
    console.log('Password: test123');
    console.log('User ID:', result.insertId);
    
  } catch (err) {
    console.error('Error adding test user:', err);
  }
  
  process.exit(0);
};

addTestUser();
