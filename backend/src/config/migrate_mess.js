require('dotenv').config({ path: '../../.env' });
const { pool } = require('./database');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mess_menu (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week  ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
        meal_type    ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
        items        TEXT NOT NULL,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_meal (day_of_week, meal_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default data
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const meals = ['Breakfast','Lunch','Snacks','Dinner'];
    
    for (const day of days) {
      for (const meal of meals) {
        await pool.query(
          `INSERT IGNORE INTO mess_menu (day_of_week, meal_type, items) VALUES (?, ?, ?)`,
          [day, meal, 'Menu items pending']
        );
      }
    }
    
    console.log("Mess menu table created and seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}
migrate();
