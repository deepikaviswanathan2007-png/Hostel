const fs = require('fs');
const csv = require('csv-parser');
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

exports.bulkStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let rows = [];
    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    try {
      rows = await parseCSV(req.file.path);
    } finally {
      // Ensure local file is ALWAYS deleted even if parsing corrupts
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }

    // Process rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        const { name, register_no, department, phone, email, year } = row;
        
        if (!name || !register_no || !email) {
          throw new Error('Name, register_no, and email are required');
        }

        // Check duplicates
        const [existing] = await pool.query(
          'SELECT id FROM students WHERE email = ? OR register_no = ?', 
          [email, register_no]
        );

        if (existing.length > 0) {
          throw new Error('Email or register number already exists');
        }
        
        const [existingUser] = await pool.query(
          'SELECT id FROM users WHERE email = ?', 
          [email]
        );
        
        if (existingUser.length > 0) {
          throw new Error('Email is already registered as a user');
        }

        const defaultPassword = await bcrypt.hash('student123', 10);
        
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        try {
          // 1. Create a user record so the student can log in
          const [userResult] = await conn.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, defaultPassword, 'student']
          );
          const userId = userResult.insertId;

          // 2. Create the student record linked to the user
          await conn.query(`
            INSERT INTO students 
            (user_id, name, register_no, department, year, phone, email) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            userId, name, register_no, department || 'CSE', year || 1, phone || '', email
          ]);
          await conn.commit();
          successCount++;
        } catch (insertError) {
          await conn.rollback();
          throw insertError;
        } finally {
          conn.release();
        }
      } catch (err) {
        failedCount++;
        errors.push({ row: rowNum, reason: err.message });
      }
    }

    res.json({ successCount, failedCount, errors });
  } catch (error) {
    console.error('Bulk student import error:', error);
    res.status(500).json({ error: 'Server error during bulk import' });
  }
};

exports.bulkRooms = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
  
      let rows = [];
      let successCount = 0;
      let failedCount = 0;
      const errors = [];
  
      try {
        rows = await parseCSV(req.file.path);
      } finally {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      }
  
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;
  
        try {
          const { roomNumber, block, floor, capacity, type } = row;
          
          if (!roomNumber || !block || !capacity) {
            throw new Error('roomNumber, block, and capacity are required');
          }
  
          if (parseInt(capacity) <= 0) {
            throw new Error('Capacity must be > 0');
          }
  
          const [existing] = await pool.query(
            'SELECT id FROM rooms WHERE room_number = ? AND block = ?', 
            [roomNumber, block]
          );
  
          if (existing.length > 0) {
            throw new Error('Room already exists in this block');
          }
  
          await pool.query(`
            INSERT INTO rooms (room_number, block, floor, capacity, room_type, status) 
            VALUES (?, ?, ?, ?, ?, 'available')
          `, [roomNumber, block, parseInt(floor) || 1, capacity, type || 'triple']);
  
          successCount++;
        } catch (err) {
          failedCount++;
          errors.push({ row: rowNum, reason: err.message });
        }
      }
  
      res.json({ successCount, failedCount, errors });
    } catch (error) {
      console.error('Bulk room import error:', error);
      res.status(500).json({ error: 'Server error during bulk import' });
    }
  };
  
exports.bulkAllocations = async (req, res) => {
    res.status(501).json({ success: false, message: 'Bulk allocation import is not yet implemented.' });
};
