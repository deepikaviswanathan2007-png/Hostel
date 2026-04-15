const { pool } = require('../config/database');
const VALID_BLOCK_CODES = new Set(['A', 'B', 'C', 'D']);
const VALID_HOSTEL_GENDERS = new Set(['MALE', 'FEMALE']);

const deriveAcademicYearFromDate = (date = new Date()) => {
  const d = new Date(date);
  const startYear = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
};

const normalizeBlockCode = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return normalized || null;
};

const validateBlockCode = (blockCode) => {
  if (blockCode == null) return null;
  if (!VALID_BLOCK_CODES.has(blockCode)) {
    return `Hostel code must be one of ${Array.from(VALID_BLOCK_CODES).join(', ')}.`;
  }
  return null;
};

const normalizeHostelGender = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim().toUpperCase();
  return normalized || null;
};

const validateHostelGender = (gender) => {
  if (gender == null) return null;
  if (!VALID_HOSTEL_GENDERS.has(gender)) {
    return `Hostel gender must be one of ${Array.from(VALID_HOSTEL_GENDERS).join(', ')}.`;
  }
  return null;
};

// ── Get all hostels ───────────────────────────────────────────
const getAll = async (req, res) => {
  try {
    const [hostels] = await pool.query(
      `SELECT h.*, u.name as warden_name, u.email as warden_email
       FROM hostels h
       LEFT JOIN users u ON u.id = h.warden_id
       ORDER BY h.name ASC`
    );

    // Attach actual room count per hostel
    const [roomCounts] = await pool.query(
      `SELECT block, COUNT(*) as count FROM rooms GROUP BY block`
    );
    const blockMap = {};
    roomCounts.forEach(r => { blockMap[r.block] = r.count; });

    const result = hostels.map(h => ({
      ...h,
      actual_room_count: h.block_code ? (blockMap[h.block_code] || 0) : 0,
    }));

    res.json({ success: true, hostels: result });
  } catch (err) {
    console.error('hostels getAll error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching hostels.' });
  }
};

// ── Create hostel ─────────────────────────────────────────────
const create = async (req, res) => {
  try {
    const { name, block_code, gender = 'MALE', total_rooms = 0, warden_id, capacity = 0 } = req.body;
    const normalizedBlockCode = normalizeBlockCode(block_code);
    const normalizedGender = normalizeHostelGender(gender) || 'MALE';
    if (!name) return res.status(400).json({ success: false, message: 'Hostel name is required.' });
    const blockCodeError = validateBlockCode(normalizedBlockCode);
    if (blockCodeError) return res.status(400).json({ success: false, message: blockCodeError });
    const genderError = validateHostelGender(normalizedGender);
    if (genderError) return res.status(400).json({ success: false, message: genderError });

    if (normalizedBlockCode) {
      const [[existing]] = await pool.query(
        'SELECT id, name FROM hostels WHERE block_code = ? LIMIT 1',
        [normalizedBlockCode]
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Hostel code ${normalizedBlockCode} is already assigned to ${existing.name}.`,
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO hostels (name, block_code, gender, total_rooms, warden_id, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, normalizedBlockCode, normalizedGender, total_rooms, warden_id || null, capacity || 0]
    );
    const [[hostel]] = await pool.query('SELECT * FROM hostels WHERE id=?', [result.insertId]);
    res.json({ success: true, hostel });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A hostel with this name already exists.' });
    }
    console.error('hostels create error:', err);
    res.status(500).json({ success: false, message: 'Server error creating hostel.' });
  }
};

// ── Update hostel ─────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const [[hostel]] = await pool.query('SELECT * FROM hostels WHERE id=?', [req.params.id]);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });

    const { name, block_code, gender, total_rooms, warden_id, capacity } = req.body;
    const normalizedBlockCode =
      block_code !== undefined ? normalizeBlockCode(block_code) : hostel.block_code;
    const normalizedGender =
      gender !== undefined ? normalizeHostelGender(gender) : hostel.gender;
    const blockCodeError = validateBlockCode(normalizedBlockCode);
    if (blockCodeError) return res.status(400).json({ success: false, message: blockCodeError });
    const genderError = validateHostelGender(normalizedGender);
    if (genderError) return res.status(400).json({ success: false, message: genderError });

    if (normalizedBlockCode) {
      const [[existing]] = await pool.query(
        'SELECT id, name FROM hostels WHERE block_code = ? AND id <> ? LIMIT 1',
        [normalizedBlockCode, req.params.id]
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Hostel code ${normalizedBlockCode} is already assigned to ${existing.name}.`,
        });
      }
    }

    await pool.query(
      `UPDATE hostels SET
         name=?, block_code=?, gender=?, total_rooms=?, warden_id=?, capacity=?, updated_at=NOW()
       WHERE id=?`,
      [
        name ?? hostel.name,
        normalizedBlockCode,
        normalizedGender,
        total_rooms ?? hostel.total_rooms,
        warden_id !== undefined ? (warden_id || null) : hostel.warden_id,
        capacity ?? hostel.capacity,
        req.params.id,
      ]
    );
    const [[updated]] = await pool.query('SELECT * FROM hostels WHERE id=?', [req.params.id]);
    res.json({ success: true, hostel: updated });
  } catch (err) {
    console.error('hostels update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating hostel.' });
  }
};

// ── Delete hostel ─────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [[hostel]] = await pool.query('SELECT * FROM hostels WHERE id=?', [req.params.id]);
    if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
    await pool.query('DELETE FROM hostels WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Hostel deleted successfully.' });
  } catch (err) {
    console.error('hostels remove error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting hostel.' });
  }
};

// ── Get warden detail with hostel stats ───────────────────────
const getWardenDetail = async (req, res) => {
  try {
    const wardenId = req.params.id;
    const [[warden]] = await pool.query(
      'SELECT id, name, email, role, specialty, created_at FROM users WHERE id=? AND role="warden"',
      [wardenId]
    );
    if (!warden) return res.status(404).json({ success: false, message: 'Warden not found.' });

    const [[hostel]] = await pool.query(
      'SELECT * FROM hostels WHERE warden_id=? LIMIT 1',
      [wardenId]
    );

    let hostelStats = null;
    if (hostel) {
      const [[{ totalRooms }]] = await pool.query(
        'SELECT COUNT(*) as totalRooms FROM rooms WHERE block=?',
        [hostel.block_code || '']
      );
      const [[{ occupiedRooms }]] = await pool.query(
        "SELECT COUNT(*) as occupiedRooms FROM rooms WHERE block=? AND status='occupied'",
        [hostel.block_code || '']
      );
      const [[{ totalStudents }]] = await pool.query(
        `SELECT COUNT(*) as totalStudents FROM students s
         INNER JOIN rooms r ON r.id=s.room_id
         WHERE r.block=?`,
        [hostel.block_code || '']
      );
      const [rooms] = await pool.query(
        `SELECT r.id, r.room_number, r.capacity, r.occupied, r.status,
                GROUP_CONCAT(s.name SEPARATOR '||') as student_names,
                GROUP_CONCAT(s.register_no SEPARATOR '||') as reg_nos
         FROM rooms r
         LEFT JOIN students s ON s.room_id=r.id
         WHERE r.block=?
         GROUP BY r.id
         ORDER BY r.room_number ASC`,
        [hostel.block_code || '']
      );

      hostelStats = {
        hostel,
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        totalStudents,
        rooms: rooms.map(room => ({
          ...room,
          currentOccupancy: room.occupied,
          status: room.occupied >= room.capacity ? 'Full' : 'Available',
          students: room.student_names
            ? room.student_names.split('||').map((name, i) => ({
                name,
                register_no: (room.reg_nos || '').split('||')[i] || '',
              }))
            : [],
        })),
      };
    }

    res.json({ success: true, warden, hostelStats });
  } catch (err) {
    console.error('getWardenDetail error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching warden detail.' });
  }
};

// ── Student: Get own room details ─────────────────────────────
const getMyRoom = async (req, res) => {
  try {
    // Find student by user_id or email
    let student = null;
    const [byUserId] = await pool.query(
      `SELECT s.*, r.room_number, r.block, r.floor, r.room_type, r.status as room_status
       FROM students s LEFT JOIN rooms r ON r.id=s.room_id
       WHERE s.user_id=?`,
      [req.user.id]
    );
    if (byUserId.length) {
      student = byUserId[0];
    } else {
      const [[u]] = await pool.query('SELECT email FROM users WHERE id=?', [req.user.id]);
      const [byEmail] = await pool.query(
        `SELECT s.*, r.room_number, r.block, r.floor, r.room_type, r.status as room_status
         FROM students s LEFT JOIN rooms r ON r.id=s.room_id
         WHERE s.email=?`,
        [u.email]
      );
      if (byEmail.length) student = byEmail[0];
    }

    if (!student || !student.room_id) {
      return res.json({ success: true, allocated: false, room: null, allocation: null });
    }

    // Get active allocation
    const [[allocation]] = await pool.query(
      `SELECT * FROM allocations WHERE student_id=? AND is_active=1 ORDER BY allocated_at DESC LIMIT 1`,
      [student.id]
    );

    // Use latest approved application for academic metadata; fallback to latest application.
    const [[approvedApp]] = await pool.query(
      `SELECT academic_year, semester
       FROM hostel_applications
       WHERE student_id=? AND status='approved'
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [student.id]
    );
    let latestApp = null;
    if (!approvedApp) {
      const [latestRows] = await pool.query(
        `SELECT academic_year, semester
         FROM hostel_applications
         WHERE student_id=?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`,
        [student.id]
      );
      latestApp = latestRows[0] || null;
    }
    const applicationMeta = approvedApp || latestApp || null;
    const academicYearValue = applicationMeta?.academic_year || deriveAcademicYearFromDate();
    const semesterValue = applicationMeta?.semester || student.year || null;
    const [roommateRows] = await pool.query(
      `SELECT id, name, register_no, department, year
       FROM students
       WHERE room_id=? AND id<>?
       ORDER BY name ASC`,
      [student.room_id, student.id]
    );

    res.json({
      success: true,
      allocated: true,
      room: {
        id: student.room_id,
        roomNumber: student.room_number,
        roomType: student.room_type,
        floorNumber: student.floor,
        blockName: student.block,
        status: student.room_status,
        amenities: null,
        description: null,
      },
      allocation: allocation ? {
        id: allocation.id,
        academicYear: academicYearValue,
        semester: semesterValue,
        status: 'ACTIVE',
        allocationDate: allocation.allocated_at,
        endDate: allocation.vacated_at,
      } : null,
      roommates: roommateRows || [],
    });
  } catch (err) {
    console.error('getMyRoom error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching room details.' });
  }
};

module.exports = { getAll, create, update, remove, getWardenDetail, getMyRoom };
