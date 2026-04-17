const { pool } = require('../config/database');

const VALID_STATUSES = new Set(['open', 'resolved', 'blocked', 'ignored']);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

const parseIntSafe = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

exports.getIncidents = async (req, res) => {
  try {
    const status = String(req.query.status || '').trim();
    const severity = String(req.query.severity || '').trim();
    const eventType = String(req.query.event_type || '').trim();
    const search = String(req.query.search || '').trim();
    const page = Math.max(1, parseIntSafe(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, parseIntSafe(req.query.limit, 25)));
    const offset = (page - 1) * limit;

    const where = [];
    const args = [];

    if (status) {
      where.push('si.status = ?');
      args.push(status);
    }
    if (severity) {
      where.push('si.severity = ?');
      args.push(severity);
    }
    if (eventType) {
      where.push('si.event_type = ?');
      args.push(eventType);
    }
    if (search) {
      where.push('(si.actor_email LIKE ? OR si.target_user_name LIKE ? OR si.endpoint LIKE ? OR si.source_ip LIKE ? OR si.message LIKE ?)');
      const token = `%${search}%`;
      args.push(token, token, token, token, token);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT
        si.*,
        reviewer.name AS reviewed_by_name
      FROM security_incidents si
      LEFT JOIN users reviewer ON reviewer.id = si.reviewed_by
      ${whereSql}
      ORDER BY si.created_at DESC
      LIMIT ? OFFSET ?`,
      [...args, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM security_incidents si ${whereSql}`,
      args
    );

    const [statsRows] = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
        SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END) AS high_risk_count
      FROM security_incidents`
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: countRows[0]?.total || 0,
      },
      stats: statsRows[0] || {
        total: 0,
        open_count: 0,
        blocked_count: 0,
        resolved_count: 0,
        high_risk_count: 0,
      },
    });
  } catch (err) {
    console.error('security.getIncidents error:', err);
    res.status(500).json({ success: false, message: 'Failed to load security incidents.' });
  }
};

exports.resolveIncident = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || 'resolved').trim();
    if (!id || !VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid incident update request.' });
    }

    const [result] = await pool.query(
      `UPDATE security_incidents
       SET status = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [status, req.user.id, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    return res.json({ success: true, message: 'Incident updated.' });
  } catch (err) {
    console.error('security.resolveIncident error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update incident.' });
  }
};

exports.blockIncidentIp = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid incident id.' });
    }

    const reason = String(req.body.reason || 'Blocked from security incident').slice(0, 255);

    const [rows] = await pool.query('SELECT source_ip FROM security_incidents WHERE id = ? LIMIT 1', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const sourceIp = rows[0].source_ip;
    if (!sourceIp) {
      return res.status(400).json({ success: false, message: 'No source IP available for this incident.' });
    }

    await pool.query(
      `INSERT INTO blocked_ips (ip_address, reason, blocked_by_user_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), blocked_by_user_id = VALUES(blocked_by_user_id), updated_at = NOW(), expires_at = NULL`,
      [sourceIp, reason, req.user.id]
    );

    await pool.query(
      `UPDATE security_incidents
       SET status = 'blocked', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    return res.json({ success: true, message: `IP ${sourceIp} has been blocked.` });
  } catch (err) {
    console.error('security.blockIncidentIp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to block IP.' });
  }
};

exports.deleteIncident = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Invalid incident id.' });
    }

    const [result] = await pool.query('DELETE FROM security_incidents WHERE id = ?', [id]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    return res.json({ success: true, message: 'Incident deleted.' });
  } catch (err) {
    console.error('security.deleteIncident error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete incident.' });
  }
};

exports.createManualIncident = async (req, res) => {
  try {
    const eventType = String(req.body.event_type || '').trim();
    const severity = String(req.body.severity || 'medium').trim();
    const message = String(req.body.message || '').trim();

    if (!eventType || !VALID_SEVERITIES.has(severity)) {
      return res.status(400).json({ success: false, message: 'Invalid incident payload.' });
    }

    await pool.query(
      `INSERT INTO security_incidents
      (event_type, severity, status, actor_user_id, actor_email, actor_role, request_method, endpoint, source_ip, user_agent, browser, operating_system, device_type, message)
      VALUES (?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventType,
        severity,
        req.user?.id || null,
        req.user?.email || null,
        req.user?.role || null,
        req.method,
        req.originalUrl,
        req.ip,
        req.headers['user-agent'] || null,
        null,
        null,
        null,
        message || null,
      ]
    );

    return res.status(201).json({ success: true, message: 'Incident created.' });
  } catch (err) {
    console.error('security.createManualIncident error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create incident.' });
  }
};
