const { pool } = require('../config/database');

function normalizeWing(w) {
  if (w == null || w === '') return null;
  const x = String(w).trim().toLowerCase();
  if (x === 'left') return 'left';
  if (x === 'right') return 'right';
  return null;
}

function normalizeBlock(b) {
  if (b == null || b === '') return null;
  const raw = String(b).trim();
  const x = raw.toUpperCase();
  if (/^BLOCK_[A-Z]$/.test(x)) return x.replace('BLOCK_', '');
  if (/^[A-Z]$/.test(x)) return x;
  return raw;
}

function isSingleBlockCode(v) {
  return /^[A-Z]$/.test(String(v || '').toUpperCase());
}

function toComparableBlock(v) {
  return String(v || '').trim().toUpperCase().replace(/^BLOCK_/, '');
}

/**
 * @param {object} options
 * @param {'admin'|'warden'} options.mode
 * @param {Array<{block:string,floor:number,wing:string}>|null} options.wardenScopes - required when mode is warden
 * @param {object} options.query - req.query
 */
async function listStudents({ mode, wardenScopes, query }) {
  const { search, dept, year, page = 1, limit = 20, block, floor, wing } = query;
  const blockFilter = normalizeBlock(block);
  const effectiveWingExpr =
    "COALESCE(s.wing, r.wing, CASE WHEN r.room_number IS NOT NULL THEN IF(MOD(CAST(SUBSTRING_INDEX(r.room_number, '-', -1) AS UNSIGNED), 2) = 0, 'right', 'left') END)";
  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (s.name LIKE ? OR s.register_no LIKE ? OR s.email LIKE ? OR r.room_number LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  if (dept) {
    where += ' AND s.department=?';
    params.push(dept);
  }
  if (year) {
    where += ' AND s.year=?';
    params.push(year);
  }

  if (mode === 'warden') {
    if (!wardenScopes || !wardenScopes.length) {
      return { rows: [], total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) };
    }
    let refined = [...wardenScopes];
    if (blockFilter) refined = refined.filter((s) => toComparableBlock(s.block) === toComparableBlock(blockFilter));
    if (floor !== undefined && floor !== '' && floor != null) {
      refined = refined.filter((s) => Number(s.floor) === Number(floor));
    }
    const wingFilter = normalizeWing(wing);
    if (wingFilter) refined = refined.filter((s) => s.wing === wingFilter);
    if (!refined.length) {
      return { rows: [], total: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) };
    }
    wardenScopes = refined;
    where += ` AND ${effectiveWingExpr} IS NOT NULL`;
    const orParts = [];
    for (const sc of wardenScopes) {
      orParts.push(`(r.block = ? AND COALESCE(s.floor, r.floor) = ? AND ${effectiveWingExpr} = ?)`);
      params.push(sc.block, Number(sc.floor), sc.wing);
    }
    where += ` AND (${orParts.join(' OR ')})`;
  } else {
    if (blockFilter) {
      if (isSingleBlockCode(blockFilter)) {
        where += " AND (REPLACE(UPPER(r.block), 'BLOCK_', '') = ?)";
        params.push(String(blockFilter).toUpperCase());
      } else {
        where += " AND (REPLACE(UPPER(r.block), 'BLOCK_', '') = REPLACE(UPPER(?), 'BLOCK_', '') OR UPPER(r.block) = UPPER(?) OR EXISTS (SELECT 1 FROM hostels h WHERE UPPER(h.name) = UPPER(?) AND REPLACE(UPPER(h.block_code), 'BLOCK_', '') = REPLACE(UPPER(r.block), 'BLOCK_', '')))";
        params.push(blockFilter, blockFilter, blockFilter);
      }
    }
    if (floor !== undefined && floor !== '' && floor != null) {
      where += ' AND COALESCE(s.floor, r.floor) = ?';
      params.push(Number(floor));
    }
    const nw = normalizeWing(wing);
    if (nw) {
      where += ` AND ${effectiveWingExpr} = ?`;
      params.push(nw);
    }
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitN = parseInt(limit, 10);

  const baseFrom = `FROM students s
       LEFT JOIN rooms r ON s.room_id=r.id
       LEFT JOIN users u ON s.user_id=u.id
       WHERE ${where} AND (u.role='student' OR s.user_id IS NULL)`;

  const selectSql = `SELECT s.*, r.room_number, r.block, r.floor AS room_floor, r.wing AS room_wing,
       COALESCE(s.floor, r.floor) AS effective_floor,
       ${effectiveWingExpr} AS effective_wing
       ${baseFrom}
       ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;

  const [rows] = await pool.query(selectSql, [...params, limitN, offset]);
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total ${baseFrom}`, params);

  return {
    rows,
    total,
    page: parseInt(page, 10),
    limit: limitN,
  };
}

module.exports = { listStudents, normalizeWing, normalizeBlock };
