import { pool } from "./config/db.js";

const updateTestUser = async () => {
  try {
    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT id, username, email, first_name, last_name, is_verified FROM users WHERE username = ?',
      ['minty_min']
    );
    
    if (existingUsers.length > 0) {
      console.log('User minty_min already exists:', existingUsers[0]);
      
      // Update the existing user to be verified and have correct name
      const [result] = await pool.query(
        'UPDATE users SET first_name = ?, last_name = ?, is_verified = 1 WHERE username = ?',
        ['Minty', 'Super Fresh', 'minty_min']
      );
      
      console.log('✅ User updated successfully!');
      console.log('Username: minty_min');
      console.log('Full Name: Minty Super Fresh');
      console.log('Status: Verified');
      
    } else {
      console.log('User minty_min not found in database');
    }
    
  } catch (err) {
    console.error('Error updating test user:', err);
  }
  
  process.exit(0);
};

updateTestUser();
