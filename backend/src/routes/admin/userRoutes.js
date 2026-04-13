const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../../middleware/auth');
const userCtrl = require('../../controllers/userController');
const studentCtrl = require('../../controllers/studentController');
const floorWardenCtrl = require('../../controllers/floorWardenController');
const bulkCtrl = require('../../controllers/bulkController');
const multer = require('multer');

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are permitted.'));
    }
  }
});

// ── Users (Admin CRUD) ───────────────────────────────────
router.get   ('/users',     authenticate, adminOnly, userCtrl.getAll);
router.get   ('/users/:id', authenticate, adminOnly, userCtrl.getOne);
router.post  ('/users',     authenticate, adminOnly, userCtrl.create);
router.put   ('/users/:id', authenticate, adminOnly, userCtrl.update);
router.delete('/users/:id', authenticate, adminOnly, userCtrl.remove);

// ── Students (Admin) ─────────────────────────────────────
router.get   ('/students',         authenticate, adminOnly, studentCtrl.getAll);
router.get   ('/students/export',  authenticate, adminOnly, studentCtrl.exportCSV);
router.get   ('/students/:id',     authenticate, adminOnly, studentCtrl.getOne);
router.post  ('/students',         authenticate, adminOnly, studentCtrl.create);
router.put   ('/students/:id',     authenticate, adminOnly, studentCtrl.update);
router.delete('/students/:id',     authenticate, adminOnly, studentCtrl.remove);

// ── Bulk Students Upload ─────────────────────────────────
router.post('/bulk/students', authenticate, adminOnly, upload.single('file'), bulkCtrl.bulkStudents);

// ── Floor Wardens (Admin) ────────────────────────────────
router.get   ('/rooms/wardens',       authenticate, adminOnly, floorWardenCtrl.getWardens);
router.get   ('/rooms/floor-wardens', authenticate, adminOnly, floorWardenCtrl.getAssignments);
router.put   ('/rooms/floor-wardens', authenticate, adminOnly, floorWardenCtrl.setAssignments);

module.exports = router;
