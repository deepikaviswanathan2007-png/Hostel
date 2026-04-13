const { pool } = require('../config/database');
const { Parser } = require('json2csv');

const getAll = async (req, res) => {
  try {
    const { block, status, hostel_id } = req.query;
    let where = '1=1'; const params = [];
    if (block)  { where += ' AND r.block=?'; params.push(block); }
    if (status) { where += ' AND r.status=?'; params.push(status); }
    if (hostel_id) { where += ' AND h.id=?'; params.push(hostel_id); }
    const [rows] = await pool.query(
      `SELECT r.*, h.id AS hostel_id, h.name AS hostel_name
       FROM rooms r
       LEFT JOIN hostels h
         ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
       WHERE ${where}
       ORDER BY r.block, r.floor, r.room_number`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const getOne = async (req, res) => {
  try {
    const [room] = await pool.query(
      `SELECT r.*, h.id AS hostel_id, h.name AS hostel_name
       FROM rooms r
       LEFT JOIN hostels h
         ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
       WHERE r.id=?`,
      [req.params.id]
    );
    if (!room.length) return res.status(404).json({ success: false, message: 'Room not found.' });
    const [students] = await pool.query('SELECT id,name,register_no,department,year FROM students WHERE room_id=?', [req.params.id]);
    res.json({ success: true, data: { ...room[0], students } });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

const create = async (req, res) => {
  const { room_number, block, floor, wing, capacity, room_type } = req.body;
  if (!room_number || !block || typeof floor === 'undefined' || !capacity)
    return res.status(400).json({ success: false, message: 'room_number, block, floor, capacity required.' });
  try {
    const status = 'available'; // New room is always available
    const [result] = await pool.query(
      'INSERT INTO rooms (room_number,block,floor,wing,capacity,room_type,status,occupied) VALUES (?,?,?,?,?,?,?,?)',
      [room_number, block, floor, wing || null, capacity, room_type || 'triple', status, 0]
    );
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
    if (room && status !== 'maintenance') {
      const occ = room.occupied || 0;
      status = (occ >= capacity) ? 'occupied' : 'available';
    }

    let sql = 'UPDATE rooms SET capacity=?, room_type=?, status=?';
    const params = [capacity, room_type, status];
    if (Object.prototype.hasOwnProperty.call(req.body, 'wing')) {
      sql += ', wing=?';
      params.push(wing || null);
    }
    sql += ' WHERE id=?';
    params.push(req.params.id);
    await pool.query(sql, params);
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
    const [rows] = await pool.query(
      `SELECT r.room_number, h.name AS hostel_name, r.block, r.floor, r.capacity, r.occupied, r.room_type, r.status
       FROM rooms r
       LEFT JOIN hostels h
         ON UPPER(TRIM(REPLACE(h.block_code, 'BLOCK_', ''))) = UPPER(TRIM(REPLACE(r.block, 'BLOCK_', '')))
       ORDER BY r.block, r.floor, r.room_number`
    );
    const parser = new Parser({ fields: ['room_number','hostel_name','block','floor','capacity','occupied','room_type','status'] });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('rooms.csv');
    res.send(csv);
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Export failed.' }); }
};

module.exports = { getAll, getOne, create, update, remove, exportCSV };

