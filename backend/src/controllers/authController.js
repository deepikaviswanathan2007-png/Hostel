const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const cookieName = process.env.AUTH_COOKIE_NAME || 'auth_token';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password required.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const user = rows[0];
    if (!user.password)
      return res.status(401).json({ success: false, message: 'This account uses Google login. Please sign in with Google.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const token = signToken(user);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    // Attach student_id for student-role users
    if (user.role === 'student') {
      let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!studentRows.length) {
        [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
        if (studentRows.length) {
          await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [user.id, studentRows[0].id]);
        }
      }
      if (studentRows.length) userData.student_id = studentRows[0].id;
    }

    res.cookie(cookieName, token, cookieOptions());
    res.json({
      success: true,
      message: 'Login successful.',
      user: userData,
      token, // Return token for Bearer auth
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    return res.status(400).json({ success: false, message: 'Google credential required.' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: googleId, email, name } = ticket.getPayload();

    // 1. Look up by google_id
    let [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);

    if (!rows.length) {
      // 2. Look up by email (link existing account)
      [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

      if (rows.length) {
        await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, rows[0].id]);
      } else {
        return res.status(403).json({ 
          success: false, 
          message: 'Account not found. Please contact an administrator to register your email before logging in.' 
        });
      }
    }

    const user = rows[0];
    const token = signToken(user);

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };

    // Attach student_id for student-role users
    if (user.role === 'student') {
      let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [user.id]);
      if (!studentRows.length) {
        // Try matching by email and auto-link
        [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [user.email]);
        if (studentRows.length) {
          await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [user.id, studentRows[0].id]);
          userData.student_id = studentRows[0].id;
        } else {
          // Auto-create pending student record
          const tempRegNo = `G-${user.id}-${Date.now().toString().slice(-4)}`;
          const [insertRes] = await pool.query(
            'INSERT INTO students (user_id, name, email, register_no, department, year) VALUES (?, ?, ?, ?, ?, ?)',
            [user.id, user.name, user.email, tempRegNo, 'PENDING', 1]
          );
          userData.student_id = insertRes.insertId;
        }
      } else {
        userData.student_id = studentRows[0].id;
      }
    }

    res.cookie(cookieName, token, cookieOptions());
    res.json({
      success: true,
      message: 'Google login successful.',
      user: userData,
      token, // Return token for Bearer auth
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ success: false, message: 'Google authentication failed: ' + err.message });
  }
};

const logout = async (req, res) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ success: true, message: 'Logged out.' });
};

const me = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,name,email,role,created_at FROM users WHERE id=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });

    const userData = rows[0];

    // For student-role users, also fetch the linked student record id
    if (userData.role === 'student') {
      let [studentRows] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userData.id]);
      if (!studentRows.length) {
        [studentRows] = await pool.query('SELECT id FROM students WHERE email = ?', [userData.email]);
        if (studentRows.length) {
          await pool.query('UPDATE students SET user_id = ? WHERE id = ?', [userData.id, studentRows[0].id]);
          userData.student_id = studentRows[0].id;
        } else {
          // Auto-create pending student record
          const tempRegNo = `G-${userData.id}-${Date.now().toString().slice(-4)}`;
          const [insertRes] = await pool.query(
            'INSERT INTO students (user_id, name, email, register_no, department, year) VALUES (?, ?, ?, ?, ?, ?)',
            [userData.id, userData.name, userData.email, tempRegNo, 'PENDING', 1]
          );
          userData.student_id = insertRes.insertId;
        }
      } else {
        userData.student_id = studentRows[0].id;
      }
    }

    const token = signToken(userData);
    res.json({ success: true, user: userData, token });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]);
    if (!rows[0].password)
      return res.status(400).json({ success: false, message: 'Cannot change password for Google-linked accounts. Use Google to sign in.' });
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) { console.error('Error in ' + __filename + ':', err); res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { login, googleLogin, me, changePassword, logout };
