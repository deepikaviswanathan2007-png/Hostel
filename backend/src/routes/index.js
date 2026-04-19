const express = require('express');
const router = express.Router();
const { authenticate, adminOnly, caretakerOrAdmin, wardenOrAdmin, requireRoles } = require('../middleware/auth');
const { studentsListAccess } = require('../middleware/wardenScope');
const validate = require('../middleware/validate');
const {
    signupSchema,
    loginSchema,
    googleLoginSchema,
    refreshSchema,
    changePasswordSchema,
} = require('../validators/authSchemas');

const authCtrl = require('../controllers/authController');
const dashCtrl = require('../controllers/dashboardController');
const studentCtrl = require('../controllers/studentController');
const roomCtrl = require('../controllers/roomController');
const allocCtrl = require('../controllers/allocationController');
const complaintCtrl = require('../controllers/complaintController');
const noticeCtrl = require('../controllers/noticeController');
const studentPortal = require('../controllers/studentPortalController');
const bulkCtrl = require('../controllers/bulkController');
const caretakerCtrl = require('../controllers/caretakerController');
const wardenCtrl = require('../controllers/wardenController');
const visitorCtrl = require('../controllers/visitorController');
const leaveCtrl = require('../controllers/leaveController');
const messCtrl = require('../controllers/messMenuController');
const floorWardenCtrl = require('../controllers/floorWardenController');
const assignWardenCtrl = require('../controllers/assignWardenController');
const hostelAppCtrl = require('../controllers/hostelApplicationController');
const requestCtrl = require('../controllers/requestController');
const attendanceCtrl = require('../controllers/attendanceController');
const staffDirCtrl = require('../controllers/staffDirectoryController');
const userCtrl = require('../controllers/userController');
const messageCtrl = require('../controllers/messageController');
const hostelCtrl = require('../controllers/hostelController');
const securityCtrl = require('../controllers/securityController');
const complaintUpload = require('../middleware/complaintUpload');
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

// ── Auth ──────────────────────────────────────────────────
router.post('/auth/signup', validate(signupSchema), authCtrl.signup);
router.post('/auth/login', validate(loginSchema), authCtrl.login);
router.post('/auth/google', validate(googleLoginSchema), authCtrl.googleLogin);
router.post('/auth/refresh', validate(refreshSchema), authCtrl.refresh);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/csrf-token', authCtrl.csrfToken);
router.get('/auth/me', authenticate, authCtrl.me);
router.put('/auth/change-password', authenticate, validate(changePasswordSchema), authCtrl.changePassword);

// ── RBAC Examples (admin/user) ─────────────────────────────
router.get('/example/protected-user', authenticate, requireRoles(['user', 'admin']), (req, res) => {
    return res.json({ success: true, message: 'User-level protected route accessed successfully.' });
});
router.get('/example/protected-admin', authenticate, requireRoles(['admin']), (req, res) => {
    return res.json({ success: true, message: 'Admin-level protected route accessed successfully.' });
});

// ── Dashboard (Admin) ─────────────────────────────────────
router.get('/dashboard', authenticate, adminOnly, dashCtrl.getStats);

// ── Caretaker Dashboard ───────────────────────────────────
router.get('/caretaker/dashboard', authenticate, caretakerOrAdmin, caretakerCtrl.getStats);
router.get('/caretaker/complaints', authenticate, caretakerOrAdmin, caretakerCtrl.getComplaints);
router.put('/caretaker/complaints/:id', authenticate, caretakerOrAdmin, caretakerCtrl.updateComplaintStatus);

// ── Warden Dashboard ──────────────────────────────────────
router.get('/warden/dashboard', authenticate, wardenOrAdmin, wardenCtrl.getStats);
router.get('/warden/my-scope', authenticate, wardenOrAdmin, wardenCtrl.getMyScope);
router.get('/warden/students', authenticate, wardenOrAdmin, wardenCtrl.getStudents);
router.get('/warden/complaints', authenticate, wardenOrAdmin, wardenCtrl.getComplaints);

// ── Users (Admin CRUD) ───────────────────────────────────
router.get('/users', authenticate, adminOnly, userCtrl.getAll);
router.get('/users/:id', authenticate, adminOnly, userCtrl.getOne);
router.post('/users', authenticate, adminOnly, userCtrl.create);
router.put('/users/:id', authenticate, adminOnly, userCtrl.update);
router.delete('/users/:id', authenticate, adminOnly, userCtrl.remove);

// ── Students (Admin / scoped Warden) ─────────────────────
router.post('/assign-warden', authenticate, adminOnly, assignWardenCtrl.assign);
router.get('/students', authenticate, studentsListAccess, studentCtrl.getAll);
router.get('/students/export', authenticate, adminOnly, studentCtrl.exportCSV);
router.get('/students/:id', authenticate, adminOnly, studentCtrl.getOne);
router.post('/students', authenticate, adminOnly, studentCtrl.create);
router.put('/students/:id', authenticate, adminOnly, studentCtrl.update);
router.delete('/students/:id', authenticate, adminOnly, studentCtrl.remove);

// ── Rooms (Admin) ────────────────────────────────────────
router.get('/rooms/wardens', authenticate, adminOnly, floorWardenCtrl.getWardens);
router.get('/rooms/floor-wardens', authenticate, adminOnly, floorWardenCtrl.getAssignments);
router.put('/rooms/floor-wardens', authenticate, adminOnly, floorWardenCtrl.setAssignments);
router.get('/rooms/export', authenticate, adminOnly, roomCtrl.exportCSV);
router.get('/rooms', authenticate, adminOnly, roomCtrl.getAll);
router.get('/rooms/:id', authenticate, adminOnly, roomCtrl.getOne);
router.post('/rooms', authenticate, adminOnly, roomCtrl.create);
router.put('/rooms/:id', authenticate, adminOnly, roomCtrl.update);
router.delete('/rooms/:id', authenticate, adminOnly, roomCtrl.remove);

// ── Visitors (Admin / Warden) ────────────────────────────
router.get('/visitors', authenticate, wardenOrAdmin, visitorCtrl.getAll);
router.post('/visitors', authenticate, wardenOrAdmin, visitorCtrl.create);
router.put('/visitors/:id/exit', authenticate, wardenOrAdmin, visitorCtrl.markExit);
router.delete('/visitors/:id', authenticate, adminOnly, visitorCtrl.remove);

// ── Leaves / Outpasses ───────────────────────────────────
router.get('/leaves', authenticate, leaveCtrl.getAll);
router.post('/leaves', authenticate, leaveCtrl.create);
router.put('/leaves/:id/status', authenticate, wardenOrAdmin, leaveCtrl.updateStatus);
router.delete('/leaves/:id', authenticate, leaveCtrl.remove);

// ── Mess Menu ────────────────────────────────────────────
router.get('/mess-menu', authenticate, messCtrl.getAll);
router.put('/mess-menu', authenticate, wardenOrAdmin, messCtrl.update);

// ── Allocations (Admin) ──────────────────────────────────
router.post('/allocations/allocate', authenticate, adminOnly, allocCtrl.allocate);
router.post('/allocations/vacate', authenticate, adminOnly, allocCtrl.vacate);
router.get('/allocations/history', authenticate, adminOnly, allocCtrl.history);

// ── Complaints (Admin) ───────────────────────────────────
router.get('/complaints', authenticate, adminOnly, complaintCtrl.getAll);
router.post('/complaints', authenticate, adminOnly, complaintCtrl.create);
router.put('/complaints/:id', authenticate, adminOnly, complaintCtrl.updateStatus);
router.delete('/complaints/:id', authenticate, adminOnly, complaintCtrl.remove);

// ── Notices ──────────────────────────────────────────────
router.get('/notices', authenticate, noticeCtrl.getAll);
router.post('/notices', authenticate, adminOnly, noticeCtrl.create);
router.delete('/notices/:id', authenticate, adminOnly, noticeCtrl.remove);

// ── Hostel Applications ──────────────────────────────────
router.get('/hostel-applications', authenticate, wardenOrAdmin, hostelAppCtrl.getAll);
router.put('/hostel-applications/:id', authenticate, wardenOrAdmin, hostelAppCtrl.review);

// ── Requests (Room Change, etc.) ─────────────────────────
router.get('/requests', authenticate, wardenOrAdmin, requestCtrl.getAll);
router.put('/requests/:id', authenticate, wardenOrAdmin, requestCtrl.review);

// ── Attendance ───────────────────────────────────────────
router.get('/attendance', authenticate, wardenOrAdmin, attendanceCtrl.getAll);
router.post('/attendance', authenticate, wardenOrAdmin, attendanceCtrl.markAttendance);
router.post('/attendance/bulk', authenticate, wardenOrAdmin, attendanceCtrl.bulkMark);

// ── Staff Directory ──────────────────────────────────────
router.get('/staff-directory', authenticate, staffDirCtrl.getAll);

// ── Student Portal ───────────────────────────────────────
router.get('/student/profile', authenticate, studentPortal.getMyProfile);
router.get('/student/dashboard', authenticate, studentPortal.getMyDashboard);
router.get('/student/complaints', authenticate, studentPortal.getMyComplaints);
router.post('/student/complaints', authenticate, complaintUpload.single('attachment'), studentPortal.fileComplaint);
router.put('/student/complaints/:id', authenticate, complaintUpload.single('attachment'), studentPortal.updateMyComplaint);
router.patch('/student/complaints/:id/resolve', authenticate, studentPortal.resolveMyComplaint);

router.get('/student/hostel-applications', authenticate, hostelAppCtrl.getMyApplications);
router.post('/student/hostel-applications', authenticate, hostelAppCtrl.create);

router.get('/student/requests', authenticate, requestCtrl.getMyRequests);
router.post('/student/requests', authenticate, requestCtrl.create);

router.get('/student/attendance', authenticate, attendanceCtrl.getMyAttendance);
router.get('/student/visitors', authenticate, visitorCtrl.getMine);
router.post('/student/visitors', authenticate, visitorCtrl.createForStudent);

// ── Bulk Uploads ─────────────────────────────────────────
router.post('/bulk/students', authenticate, adminOnly, upload.single('file'), bulkCtrl.bulkStudents);
router.post('/bulk/rooms', authenticate, adminOnly, upload.single('file'), bulkCtrl.bulkRooms);
router.post('/bulk/allocations', authenticate, adminOnly, upload.single('file'), bulkCtrl.bulkAllocations);

// ── Warden ↔ Admin Messages ───────────────────────────────────
router.post('/messages/warden/send', authenticate, messageCtrl.wardenSendMessage);
router.get('/messages/warden/sent', authenticate, messageCtrl.wardenGetSent);
router.get('/messages/warden/received', authenticate, messageCtrl.wardenGetReceived);
router.get('/messages/admin/all', authenticate, adminOnly, messageCtrl.adminGetAllMessages);
router.post('/messages/admin/send', authenticate, adminOnly, messageCtrl.adminSendMessage);
router.put('/messages/admin/:id/status', authenticate, adminOnly, messageCtrl.adminUpdateMessage);
router.put('/messages/:id/mark-seen', authenticate, messageCtrl.markSeen);
router.delete('/messages/admin/:id', authenticate, adminOnly, messageCtrl.adminDeleteMessage);

// ── Hostels (Multi-hostel management) ─────────────────────────
router.get('/hostels', authenticate, hostelCtrl.getAll);
router.post('/hostels', authenticate, adminOnly, hostelCtrl.create);
router.get('/hostels/warden/:id', authenticate, adminOnly, hostelCtrl.getWardenDetail);
router.put('/hostels/:id', authenticate, adminOnly, hostelCtrl.update);
router.delete('/hostels/:id', authenticate, adminOnly, hostelCtrl.remove);

// ── Student: My Room ──────────────────────────────────────────
router.get('/student/my-room', authenticate, hostelCtrl.getMyRoom);

// ── Security & Malpractice Logs (Admin) ───────────────────────
router.get('/security/logs', authenticate, adminOnly, securityCtrl.getIncidents);
router.get('/security/incidents', authenticate, adminOnly, securityCtrl.getIncidents);
router.post('/security/incidents', authenticate, adminOnly, securityCtrl.createManualIncident);
router.patch('/security/incidents/:id/resolve', authenticate, adminOnly, securityCtrl.resolveIncident);
router.patch('/security/incidents/:id/block-account', authenticate, adminOnly, securityCtrl.blockIncidentAccount);
router.patch('/security/incidents/:id/block', authenticate, adminOnly, securityCtrl.blockIncidentAccount);
router.delete('/security/incidents/:id', authenticate, adminOnly, securityCtrl.deleteIncident);

module.exports = router;
