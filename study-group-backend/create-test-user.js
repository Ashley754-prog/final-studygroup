import { pool } from './config/db.js';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
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
    
    console.log('Test user created successfully!');
    console.log('User ID:', result.insertId);
    console.log('Username: minty_min');
    console.log('Email: hz202300123@wmsu.edu.ph');
    console.log('Password: minty_fresh');
    console.log('Status: Approved (is_verified = 1)');
    
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Test user already exists. Updating to approved status...');
      
      // Update existing user to be approved
      await pool.execute(
        `UPDATE users SET is_verified = 1 WHERE username = 'minty_min' OR email = 'hz202300123@wmsu.edu.ph'`
      );
      
      console.log('Test user updated to approved status!');
    } else {
      console.error('Error creating test user:', error);
    }
  } finally {
    process.exit(0);
  }
}

createTestUser();
