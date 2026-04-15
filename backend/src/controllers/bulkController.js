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

const VALID_BLOCKS = new Set(['A', 'B', 'C', 'D']);

const firstDefined = (row, keys = []) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
};

const normalizeBlockCode = (value) => {
  if (value == null) return null;
  let normalized = String(value).trim().toUpperCase();
  if (!normalized) return null;

  normalized = normalized.replace(/\s+/g, '_').replace(/-/g, '_');
  normalized = normalized.replace(/^BLOCK_?/, '');

  if (VALID_BLOCKS.has(normalized)) return normalized;
  return null;
};

const deriveBlockFromRoomNumber = (roomNumber) => {
  if (roomNumber == null) return null;
  const normalized = String(roomNumber).trim().toUpperCase();
  if (!normalized) return null;
  const firstAlpha = normalized.match(/[A-Z]/);
  if (!firstAlpha) return null;
  return VALID_BLOCKS.has(firstAlpha[0]) ? firstAlpha[0] : null;
};

const resolveHostelFromRow = async (row) => {
  const hostelIdRaw = firstDefined(row, ['hostel_id', 'hostelId']);
  if (hostelIdRaw) {
    const hostelId = Number(hostelIdRaw);
    if (!Number.isInteger(hostelId) || hostelId <= 0) {
      throw new Error('hostel_id must be a positive integer.');
    }
    const [[hostel]] = await pool.query('SELECT id, block_code FROM hostels WHERE id = ? LIMIT 1', [hostelId]);
    if (!hostel) throw new Error(`Hostel with id ${hostelId} not found.`);
    return {
      hostelId: hostel.id,
      block: normalizeBlockCode(hostel.block_code),
    };
  }

  const hostelName = firstDefined(row, ['hostel_name', 'hostelName', 'hostel']);
  if (hostelName) {
    const [[hostel]] = await pool.query(
      'SELECT id, block_code FROM hostels WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [String(hostelName).trim()]
    );
    if (!hostel) throw new Error(`Hostel '${hostelName}' not found.`);
    return {
      hostelId: hostel.id,
      block: normalizeBlockCode(hostel.block_code),
    };
  }

  return { hostelId: null, block: null };
};

exports.bulkStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
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
        return res.status(400).json({ success: false, message: 'No file uploaded' });
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
          const roomNumber = firstDefined(row, ['room_number', 'roomNumber', 'room_no', 'roomNo']);
          const capacityRaw = firstDefined(row, ['capacity']);
          const floorRaw = firstDefined(row, ['floor']);
          const roomTypeRaw = firstDefined(row, ['room_type', 'roomType', 'type']);

          if (!roomNumber || !capacityRaw) {
            throw new Error('room_number and capacity are required.');
          }

          const capacity = Number(capacityRaw);
          if (!Number.isInteger(capacity) || capacity <= 0) {
            throw new Error('capacity must be a positive integer.');
          }

          const floor = floorRaw == null || String(floorRaw).trim() === '' ? 1 : Number(floorRaw);
          if (!Number.isInteger(floor) || floor <= 0) {
            throw new Error('floor must be a positive integer.');
          }

          const normalizedRoomType = String(roomTypeRaw || 'triple').trim().toLowerCase();
          if (!['single', 'double', 'triple', 'quad'].includes(normalizedRoomType)) {
            throw new Error('room_type must be one of single, double, triple, quad.');
          }

          const hostelInfo = await resolveHostelFromRow(row);
          let normalizedBlock = hostelInfo.block || deriveBlockFromRoomNumber(roomNumber);

          if (!normalizedBlock) {
            throw new Error('Unable to detect block. Provide hostel_id or hostel_name, or use room_number like A-101/B-201/C-301/D-401.');
          }

          if (!VALID_BLOCKS.has(normalizedBlock)) {
            throw new Error('block must be one of A, B, C, D.');
          }
  
          const [existing] = await pool.query(
            'SELECT id FROM rooms WHERE room_number = ? AND block = ?', 
            [String(roomNumber).trim(), normalizedBlock]
          );
  
          if (existing.length > 0) {
            throw new Error('Room already exists in this block');
          }

          const baseParams = [String(roomNumber).trim(), normalizedBlock, floor, capacity, normalizedRoomType];
          try {
            await pool.query(
              `INSERT INTO rooms (room_number, hostel_id, block, floor, capacity, room_type, status)
               VALUES (?, ?, ?, ?, ?, ?, 'available')`,
              [baseParams[0], hostelInfo.hostelId || null, baseParams[1], baseParams[2], baseParams[3], baseParams[4]]
            );
          } catch (insertErr) {
            if (insertErr?.code !== 'ER_BAD_FIELD_ERROR' || !/hostel_id/i.test(insertErr?.sqlMessage || '')) {
              throw insertErr;
            }
            await pool.query(
              `INSERT INTO rooms (room_number, block, floor, capacity, room_type, status)
               VALUES (?, ?, ?, ?, ?, 'available')`,
              baseParams
            );
          }
  
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
