require('dotenv').config();

const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'elevate_db'
  });

  try {
    // Check if column exists
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'password_changed_at' 
       AND TABLE_SCHEMA = ?`,
      [process.env.DB_NAME || 'elevate_db']
    );

    if (rows.length === 0) {
      // Column doesn't exist, add it
      await connection.query(`ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP NULL`);
      console.log('Column password_changed_at added successfully.');
    } else {
      console.log('Column password_changed_at already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
})();
