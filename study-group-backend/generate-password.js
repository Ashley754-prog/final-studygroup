import bcrypt from 'bcryptjs';

const password = 'admin123'; // You can change this
const hashedPassword = await bcrypt.hash(password, 10);

console.log('Password:', password);
console.log('Hashed password:', hashedPassword);
console.log('\nRun this SQL in phpMyAdmin:');
console.log(`UPDATE users SET password = '${hashedPassword}' WHERE email = 'admin@wmsu.edu.ph';`);
