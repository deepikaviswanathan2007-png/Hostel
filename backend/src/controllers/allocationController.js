const { pool } = require('../config/database');

const allocate = async (req, res) => {
  const { student_id, room_id } = req.body;
  if (!student_id || !room_id)
    return res.status(400).json({ success: false, message: 'student_id and room_id required.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[student]] = await conn.query('SELECT * FROM students WHERE id=?', [student_id]);
    if (!student) throw new Error('Student not found.');
    if (student.room_id) throw new Error('Student is already allocated a room. Vacate first.');
    const [[room]] = await conn.query('SELECT * FROM rooms WHERE id=? FOR UPDATE', [room_id]);
    if (!room) throw new Error('Room not found.');
    if (room.occupied >= room.capacity) throw new Error('Room is fully occupied.');
    if (room.status === 'maintenance') throw new Error('Room is under maintenance.');
    if (room.status === 'reserved') throw new Error('Room is reserved and cannot be allocated directly.');

    await conn.query(
      'UPDATE students SET room_id=?, floor=?, wing=? WHERE id=?',
      [room_id, room.floor, room.wing ?? null, student_id]
    );
    const newOccupied = room.occupied + 1;
    const newStatus = newOccupied >= room.capacity ? 'occupied' : 'available';
    await conn.query('UPDATE rooms SET occupied=?,status=? WHERE id=?', [newOccupied, newStatus, room_id]);
    await conn.query('INSERT INTO allocations (student_id,room_id) VALUES (?,?)', [student_id, room_id]);
    await conn.commit();
    res.json({ success: true, message: 'Room allocated successfully.' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, message: err.message });
  } finally { conn.release(); }
};

const vacate = async (req, res) => {
  const { student_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[student]] = await conn.query('SELECT * FROM students WHERE id=?', [student_id]);
    if (!student || !student.room_id) throw new Error('Student has no room allocated.');
    const room_id = student.room_id;
    await conn.query('UPDATE students SET room_id=NULL, floor=NULL, wing=NULL WHERE id=?', [student_id]);
    const [[room]] = await conn.query('SELECT * FROM rooms WHERE id=?', [room_id]);
    const newOccupied = Math.max(0, room.occupied - 1);
    const newStatus = newOccupied === 0 ? 'available' : newOccupied < room.capacity ? 'available' : 'occupied';
    await conn.query('UPDATE rooms SET occupied=?,status=? WHERE id=?', [newOccupied, newStatus, room_id]);
    await conn.query('UPDATE allocations SET vacated_at=NOW(),is_active=0 WHERE student_id=? AND is_active=1', [student_id]);
    await conn.commit();
    res.json({ success: true, message: 'Room vacated successfully.' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ success: false, message: err.message });
  } finally { conn.release(); }
};

const history = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*,s.name as student_name,s.register_no,r.room_number,r.block
       FROM allocations a
       JOIN students s ON a.student_id=s.id
       JOIN rooms r ON a.room_id=r.id
       ORDER BY a.allocated_at DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' }); }
};

module.exports = { allocate, vacate, history };
