const { pool } = require('../config/database');
const { Parser } = require('json2csv');

const isMissingRoomHostelId = (err) => err?.code === 'ER_BAD_FIELD_ERROR' && /hostel_id/i.test(err?.sqlMessage || '');

const getAll = async (req, res) => {
  try {
    const { block, status, hostel_id } = req.query;
    let where = '1=1'; const params = [];
    if (block)  { where += ' AND r.block=?'; params.push(block); }
    if (status) { where += ' AND r.status=?'; params.push(status); }
    if (hostel_id) { where += ' AND r.hostel_id=?'; params.push(hostel_id); }
    try {
      const [rows] = await pool.query(
        `SELECT r.*, h.id AS hostel_id, h.name AS hostel_name
         FROM rooms r
         LEFT JOIN hostels h ON r.hostel_id = h.id
         WHERE ${where}
         ORDER BY r.block, r.floor, r.room_number`,
        params
      );
      return res.json({ success: true, data: rows });
    } catch (err) {
      if (!isMissingRoomHostelId(err)) throw err;

      // Legacy schema fallback where rooms.hostel_id is not present yet.
      let legacyWhere = '1=1'; const legacyParams = [];
      if (block) { legacyWhere += ' AND r.block=?'; legacyParams.push(block); }
      if (status) { legacyWhere += ' AND r.status=?'; legacyParams.push(status); }
      if (hostel_id) { legacyWhere += ' AND h.id=?'; legacyParams.push(hostel_id); }
      const [rows] = await pool.query(
        `SELECT r.*, h.id AS hostel_id, h.name AS hostel_name
         FROM rooms r
         LEFT JOIN hostels h
           ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
         WHERE ${legacyWhere}
         ORDER BY r.block, r.floor, r.room_number`,
        legacyParams
      );
      return res.json({ success: true, data: rows });
    }
  } catch (err) { console.error('Error in ' + __filename + ':', err); return res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getOne = async (req, res) => {
  try {
    let room;
    try {
      [room] = await pool.query(
        `SELECT r.*, h.id AS hostel_id, h.name AS hostel_name
         FROM rooms r
         LEFT JOIN hostels h ON r.hostel_id = h.id
         WHERE r.id=?`,
        [req.params.id]
      );
    } catch (err) {
      if (!isMissingRoomHostelId(err)) throw err;
      [room] = await pool.query(
        `SELECT r.*, h.id AS hostel_id, h.name AS hostel_name
         FROM rooms r
         LEFT JOIN hostels h
           ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
         WHERE r.id=?`,
        [req.params.id]
      );
    }
    if (!room.length) return res.status(404).json({ success: false, message: 'Room not found.' });
    const [students] = await pool.query('SELECT id,name,register_no,department,year FROM students WHERE room_id=?', [req.params.id]);
    res.json({ success: true, data: { ...room[0], students } });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const create = async (req, res) => {
  const { room_number, hostel_id, block, floor, wing, capacity, room_type } = req.body;
  if (!room_number || !block || typeof floor === 'undefined' || !capacity)
    return res.status(400).json({ success: false, message: 'room_number, block, floor, capacity required.' });
  try {
    const status = 'available'; // New room is always available
    let result;
    try {
      [result] = await pool.query(
        'INSERT INTO rooms (room_number,hostel_id,block,floor,wing,capacity,room_type,status,occupied) VALUES (?,?,?,?,?,?,?,?,?)',
        [room_number, hostel_id || null, block, floor, wing || null, capacity, room_type || 'triple', status, 0]
      );
    } catch (err) {
      if (!isMissingRoomHostelId(err)) throw err;
      [result] = await pool.query(
        'INSERT INTO rooms (room_number,block,floor,wing,capacity,room_type,status,occupied) VALUES (?,?,?,?,?,?,?,?)',
        [room_number, block, floor, wing || null, capacity, room_type || 'triple', status, 0]
      );
    }
    res.status(201).json({ success: true, message: 'Room created.', id: result.insertId });
  } catch (err) {
    if (err.code==='ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Room number already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const update = async (req, res) => {
  const { capacity, room_type, wing } = req.body;
  let { status } = req.body;
  try {
    // Automatically recalculate status if not explicitly overriden to maintenance
    const [[room]] = await pool.query('SELECT occupied FROM rooms WHERE id=?', [req.params.id]);
    if (room && typeof capacity !== 'undefined' && Number(capacity) < Number(room.occupied || 0)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce capacity below current occupancy of ${room.occupied || 0} students.`,
      });
    }
    if (room && status !== 'maintenance') {
      const occ = room.occupied || 0;
      status = (occ >= capacity) ? 'occupied' : 'available';
    }

    let sql = 'UPDATE rooms SET capacity=?, room_type=?, status=?';
    const params = [capacity, room_type, status];
    const hasHostelIdInPayload = Object.prototype.hasOwnProperty.call(req.body, 'hostel_id');
    if (hasHostelIdInPayload) {
      sql += ', hostel_id=?';
      params.push(req.body.hostel_id || null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'wing')) {
      sql += ', wing=?';
      params.push(wing || null);
    }
    sql += ' WHERE id=?';
    params.push(req.params.id);

    try {
      await pool.query(sql, params);
    } catch (err) {
      if (!(hasHostelIdInPayload && isMissingRoomHostelId(err))) throw err;

      let legacySql = 'UPDATE rooms SET capacity=?, room_type=?, status=?';
      const legacyParams = [capacity, room_type, status];
      if (Object.prototype.hasOwnProperty.call(req.body, 'wing')) {
        legacySql += ', wing=?';
        legacyParams.push(wing || null);
      }
      legacySql += ' WHERE id=?';
      legacyParams.push(req.params.id);
      await pool.query(legacySql, legacyParams);
    }
    res.json({ success: true, message: 'Room updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const remove = async (req, res) => {
  try {
    const [s] = await pool.query('SELECT id FROM students WHERE room_id=?', [req.params.id]);
    if (s.length) return res.status(400).json({ success: false, message: 'Cannot delete room with active residents.' });
    await pool.query('DELETE FROM rooms WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Room deleted.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const exportCSV = async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await pool.query(
        `SELECT r.room_number, h.name AS hostel_name, r.block, r.floor, r.capacity, r.occupied, r.room_type, r.status
         FROM rooms r
         LEFT JOIN hostels h ON r.hostel_id = h.id
         ORDER BY r.block, r.floor, r.room_number`
      );
    } catch (err) {
      if (!isMissingRoomHostelId(err)) throw err;
      [rows] = await pool.query(
        `SELECT r.room_number, h.name AS hostel_name, r.block, r.floor, r.capacity, r.occupied, r.room_type, r.status
         FROM rooms r
         LEFT JOIN hostels h
           ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
         ORDER BY r.block, r.floor, r.room_number`
      );
    }
    const parser = new Parser({ fields: ['room_number','hostel_name','block','floor','capacity','occupied','room_type','status'] });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('rooms.csv');
    res.send(csv);
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Export failed.' }); }
};

module.exports = { getAll, getOne, create, update, remove, exportCSV };

