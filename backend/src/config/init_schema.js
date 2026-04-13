const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    multipleStatements: true
  });

  try {
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('Executing schema...');
    await connection.query(schemaSQL);
    console.log('Schema executed successfully.');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await connection.end();
  }
}

initDB();
