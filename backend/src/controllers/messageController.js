const { pool } = require('../config/database');

let wardenMessagesTableReady = false;

/**
 * Ensures `warden_messages` exists (fresh schema / migrate_new_features) and legacy tables
 * have `is_to_all_wardens`. Runs once per process after first message-route hit.
 */
const ensureWardenMessagesTable = async () => {
  if (wardenMessagesTableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS warden_messages (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      sender_id       INT NOT NULL,
      receiver_id     INT DEFAULT NULL,
      title           VARCHAR(200) NOT NULL,
      description     TEXT NOT NULL,
      priority        ENUM('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM',
      status          ENUM('SENT','SEEN','RESOLVED') DEFAULT 'SENT',
      is_to_all_wardens TINYINT(1) DEFAULT 0,
      admin_reply     TEXT DEFAULT NULL,
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_wm_sender (sender_id),
      INDEX idx_wm_receiver (receiver_id),
      INDEX idx_wm_status (status),
      INDEX idx_wm_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [cols] = await pool.query(
    `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'warden_messages' AND COLUMN_NAME = 'is_to_all_wardens'
     LIMIT 1`
  );
  if (!cols.length) {
    await pool.query(
      `ALTER TABLE warden_messages ADD COLUMN is_to_all_wardens TINYINT(1) DEFAULT 0 AFTER status`
    );
  }

  wardenMessagesTableReady = true;
};

// ── Warden: Send message to admin ────────────────────────────
const wardenSendMessage = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    if (req.user.role !== 'warden') {
      return res.status(403).json({ success: false, message: 'Only wardens can send messages to admin.' });
    }
    const { title, description, priority = 'MEDIUM' } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }
    const [result] = await pool.query(
      `INSERT INTO warden_messages (sender_id, receiver_id, title, description, priority, status, is_to_all_wardens)
       VALUES (?, NULL, ?, ?, ?, 'SENT', 0)`,
      [req.user.id, title, description, priority]
    );
    const [[msg]] = await pool.query('SELECT * FROM warden_messages WHERE id=?', [result.insertId]);
    res.json({ success: true, message: 'Message sent to admin successfully.', data: msg });
  } catch (err) {
    console.error('wardenSendMessage error:', err);
    res.status(500).json({ success: false, message: 'Server error sending message.' });
  }
};

// ── Warden: Get sent messages ─────────────────────────────────
const wardenGetSent = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    if (req.user.role !== 'warden') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const [messages] = await pool.query(
      `SELECT wm.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
       FROM warden_messages wm
       INNER JOIN users u ON u.id = wm.sender_id
       WHERE wm.sender_id = ?
       ORDER BY wm.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, messages });
  } catch (err) {
    console.error('wardenGetSent error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching messages.' });
  }
};

// ── Warden: Get received messages (from admin) ────────────────
const wardenGetReceived = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    if (req.user.role !== 'warden') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const [direct] = await pool.query(
      `SELECT wm.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
       FROM warden_messages wm
       INNER JOIN users u ON u.id = wm.sender_id
       WHERE wm.receiver_id = ?
       ORDER BY wm.created_at DESC`,
      [req.user.id]
    );
    const [broadcast] = await pool.query(
      `SELECT wm.*, u.name as sender_name, u.email as sender_email, u.role as sender_role
       FROM warden_messages wm
       INNER JOIN users u ON u.id = wm.sender_id
       WHERE wm.is_to_all_wardens = 1
       ORDER BY wm.created_at DESC`
    );
    // Merge, deduplicate by id
    const seen = new Set();
    const messages = [...direct, ...broadcast].filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
    res.json({ success: true, messages });
  } catch (err) {
    console.error('wardenGetReceived error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching messages.' });
  }
};

// ── Admin: Get all messages ───────────────────────────────────
const adminGetAllMessages = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    const [messages] = await pool.query(
      `SELECT wm.*,
              s.name as sender_name, s.email as sender_email, s.role as sender_role,
              r.name as receiver_name, r.email as receiver_email, r.role as receiver_role
       FROM warden_messages wm
       INNER JOIN users s ON s.id = wm.sender_id
       LEFT JOIN users r ON r.id = wm.receiver_id
       ORDER BY wm.created_at DESC`
    );
    res.json({ success: true, messages });
  } catch (err) {
    console.error('adminGetAllMessages error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching messages.' });
  }
};

// ── Admin: Send message to warden(s) ─────────────────────────
const adminSendMessage = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    const { warden_id, title, description, priority = 'MEDIUM', is_to_all_wardens = false } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }
    if (!is_to_all_wardens && !warden_id) {
      return res.status(400).json({ success: false, message: 'Please specify a warden or select all wardens.' });
    }
    const [result] = await pool.query(
      `INSERT INTO warden_messages (sender_id, receiver_id, title, description, priority, status, is_to_all_wardens)
       VALUES (?, ?, ?, ?, ?, 'SENT', ?)`,
      [req.user.id, warden_id || null, title, description, priority, is_to_all_wardens ? 1 : 0]
    );
    const [[msg]] = await pool.query('SELECT * FROM warden_messages WHERE id=?', [result.insertId]);
    res.json({ success: true, message: 'Message sent successfully.', data: msg });
  } catch (err) {
    console.error('adminSendMessage error:', err);
    res.status(500).json({ success: false, message: 'Server error sending message.' });
  }
};

// ── Admin: Update message status / reply ─────────────────────
const adminUpdateMessage = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    const { status, admin_reply } = req.body;
    const [[existing]] = await pool.query('SELECT * FROM warden_messages WHERE id=?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const newStatus = status || existing.status;
    const newReply  = admin_reply !== undefined ? admin_reply : existing.admin_reply;

    await pool.query(
      'UPDATE warden_messages SET status=?, admin_reply=?, updated_at=NOW() WHERE id=?',
      [newStatus, newReply, req.params.id]
    );

    // If admin wrote a new reply, send it as a new inbox message to the warden sender
    if (!existing.admin_reply && admin_reply && admin_reply.trim()) {
      const [[senderUser]] = await pool.query('SELECT id, role FROM users WHERE id=?', [existing.sender_id]);
      if (senderUser && senderUser.role === 'warden') {
        await pool.query(
          `INSERT INTO warden_messages (sender_id, receiver_id, title, description, priority, status, is_to_all_wardens)
           VALUES (?, ?, ?, ?, ?, 'SENT', 0)`,
          [req.user.id, senderUser.id, `Reply: ${existing.title}`, admin_reply.trim(), existing.priority || 'MEDIUM']
        );
      }
    }

    const [[updated]] = await pool.query('SELECT * FROM warden_messages WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Message updated successfully.', data: updated });
  } catch (err) {
    console.error('adminUpdateMessage error:', err);
    res.status(500).json({ success: false, message: 'Server error updating message.' });
  }
};

// ── Mark message as seen ──────────────────────────────────────
const markSeen = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    const [[msg]] = await pool.query('SELECT * FROM warden_messages WHERE id=?', [req.params.id]);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    await pool.query("UPDATE warden_messages SET status='SEEN', updated_at=NOW() WHERE id=?", [req.params.id]);
    res.json({ success: true, message: 'Message marked as seen.' });
  } catch (err) {
    console.error('markSeen error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── Admin: Delete message ─────────────────────────────────────
const adminDeleteMessage = async (req, res) => {
  try {
    await ensureWardenMessagesTable();
    const [[msg]] = await pool.query('SELECT * FROM warden_messages WHERE id=?', [req.params.id]);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });
    await pool.query('DELETE FROM warden_messages WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    console.error('adminDeleteMessage error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting message.' });
  }
};

module.exports = {
  wardenSendMessage,
  wardenGetSent,
  wardenGetReceived,
  adminGetAllMessages,
  adminSendMessage,
  adminUpdateMessage,
  markSeen,
  adminDeleteMessage,
};
