const { pool } = require('../config/database');

const VALID_STATUSES = new Set(['open', 'resolved', 'blocked', 'ignored']);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

const parseIntSafe = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

let securityColumnsCache = null;
let securityColumnsCacheAt = 0;
const SECURITY_COLUMNS_TTL_MS = 60 * 1000;

const getSecurityIncidentColumns = async () => {
  const now = Date.now();
  if (securityColumnsCache && now - securityColumnsCacheAt < SECURITY_COLUMNS_TTL_MS) {
    return securityColumnsCache;
  }

  try {
    const [rows] = await pool.query('SHOW COLUMNS FROM security_incidents');
    const columns = new Set(rows.map((row) => String(row.Field || '').trim()).filter(Boolean));
    securityColumnsCache = columns;
    securityColumnsCacheAt = now;
    return columns;
  } catch (error) {
    // Keep API functional when migrations are incomplete (missing security_incidents table).
    if (error?.code === 'ER_NO_SUCH_TABLE') {
      securityColumnsCache = new Set();
      securityColumnsCacheAt = now;
      return securityColumnsCache;
    }
    throw error;
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const columns = await getSecurityIncidentColumns();
    const status = String(req.query.status || '').trim();
    const severity = String(req.query.severity || '').trim();
    const eventType = String(req.query.event_type || '').trim();
    const sourceIp = String(req.query.source_ip || '').trim();
    const actorEmail = String(req.query.actor_email || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const page = Math.max(1, parseIntSafe(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, parseIntSafe(req.query.limit, 25)));
    const offset = (page - 1) * limit;

    const where = [];
    const args = [];

    if (!columns || columns.size === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0 },
        stats: {
          total: 0,
          open_count: 0,
          blocked_count: 0,
          resolved_count: 0,
          high_risk_count: 0,
        },
      });
    }

    if (status && columns.has('status')) {
      where.push('si.status = ?');
      args.push(status);
    }
    if (severity && columns.has('severity')) {
      where.push('si.severity = ?');
      args.push(severity);
    }
    if (eventType && columns.has('event_type')) {
      where.push('si.event_type = ?');
      args.push(eventType);
    }
    if (sourceIp && columns.has('source_ip')) {
      where.push('si.source_ip = ?');
      args.push(sourceIp);
    }
    if (actorEmail && columns.has('actor_email')) {
      where.push('LOWER(si.actor_email) = ?');
      args.push(actorEmail);
    }
    if (from && columns.has('created_at')) {
      where.push('si.created_at >= ?');
      args.push(from);
    }
    if (to && columns.has('created_at')) {
      where.push('si.created_at <= ?');
      args.push(to);
    }
    if (search) {
      const searchable = ['actor_email', 'target_user_name', 'endpoint', 'source_ip', 'message'].filter((col) => columns.has(col));
      if (searchable.length > 0) {
        where.push(`(${searchable.map((col) => `si.${col} LIKE ?`).join(' OR ')})`);
      }
      const token = `%${search}%`;
      for (let i = 0; i < searchable.length; i += 1) {
        args.push(token);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const includeReviewerJoin = columns.has('reviewed_by');
    const orderColumn = columns.has('created_at') ? 'si.created_at' : (columns.has('id') ? 'si.id' : null);

    const [rows] = await pool.query(
      `SELECT
        si.*,
        ${includeReviewerJoin ? 'reviewer.name AS reviewed_by_name' : 'NULL AS reviewed_by_name'}
      FROM security_incidents si
      ${includeReviewerJoin ? 'LEFT JOIN users reviewer ON reviewer.id = si.reviewed_by' : ''}
      ${whereSql}
      ${orderColumn ? `ORDER BY ${orderColumn} DESC` : ''}
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
        ${columns.has('status') ? "SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)" : '0'} AS open_count,
        ${columns.has('status') ? "SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END)" : '0'} AS blocked_count,
        ${columns.has('status') ? "SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)" : '0'} AS resolved_count,
        ${columns.has('severity') ? "SUM(CASE WHEN severity IN ('high', 'critical') THEN 1 ELSE 0 END)" : '0'} AS high_risk_count
      FROM security_incidents`
    );

    const [eventTypeRows] = columns.has('event_type')
      ? await pool.query(
          `SELECT event_type, COUNT(*) AS count
           FROM security_incidents
           GROUP BY event_type
           ORDER BY count DESC
           LIMIT 8`
        )
      : [[]];

    const [last24hRows] = columns.has('created_at')
      ? await pool.query(
          `SELECT COUNT(*) AS total
           FROM security_incidents
           WHERE created_at >= (NOW() - INTERVAL 24 HOUR)`
        )
      : [[{ total: 0 }]];

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
      insights: {
        top_event_types: eventTypeRows || [],
        last_24h_total: Number(last24hRows?.[0]?.total || 0),
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
