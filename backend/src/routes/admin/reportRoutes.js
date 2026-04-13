const express = require('express');
const router = express.Router();
const { authenticate, adminOnly, wardenOrAdmin } = require('../../middleware/auth');
const dashCtrl = require('../../controllers/dashboardController');
const attendanceCtrl = require('../../controllers/attendanceController');

router.get('/dashboard', authenticate, adminOnly, dashCtrl.getStats);

router.get ('/attendance',          authenticate, wardenOrAdmin, attendanceCtrl.getAll);
router.post('/attendance',          authenticate, wardenOrAdmin, attendanceCtrl.markAttendance);
router.post('/attendance/bulk',     authenticate, wardenOrAdmin, attendanceCtrl.bulkMark);

module.exports = router;
