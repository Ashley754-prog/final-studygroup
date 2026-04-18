import bcryptjs from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

async function fixAdminPassword() {
  try {
    const email = 'admin@wmsu.edu.ph';
    const password = 'test123';
    
    // Generate new password hash
    const hash = await bcryptjs.hash(password, 10);
    console.log('Generated hash:', hash);
    
    // Update admin password
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, email]
    );
    
    console.log('Password updated successfully!');
    console.log('Rows affected:', result.affectedRows);
    
    // Verify the update
    const [users] = await pool.execute('SELECT email, is_admin, is_verified FROM users WHERE email = ?', [email]);
    console.log('Updated user:', users[0]);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixAdminPassword();
