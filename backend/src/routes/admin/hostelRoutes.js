const express = require('express');
const router = express.Router();
const { authenticate, adminOnly, wardenOrAdmin } = require('../../middleware/auth');
const hostelCtrl = require('../../controllers/hostelController');
const roomCtrl = require('../../controllers/roomController');
const allocCtrl = require('../../controllers/allocationController');
const messCtrl = require('../../controllers/messMenuController');
const visitorCtrl = require('../../controllers/visitorController');
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

router.get   ('/hostels',              authenticate, hostelCtrl.getAll);
router.post  ('/hostels',              authenticate, adminOnly, hostelCtrl.create);
router.get   ('/hostels/warden/:id',   authenticate, adminOnly, hostelCtrl.getWardenDetail);
router.put   ('/hostels/:id',          authenticate, adminOnly, hostelCtrl.update);
router.delete('/hostels/:id',          authenticate, adminOnly, hostelCtrl.remove);

router.get   ('/rooms/export',  authenticate, adminOnly, roomCtrl.exportCSV);
router.get   ('/rooms',      authenticate, adminOnly, roomCtrl.getAll);
router.get   ('/rooms/:id',  authenticate, adminOnly, roomCtrl.getOne);
router.post  ('/rooms',      authenticate, adminOnly, roomCtrl.create);
router.put   ('/rooms/:id',  authenticate, adminOnly, roomCtrl.update);
router.delete('/rooms/:id',  authenticate, adminOnly, roomCtrl.remove);

router.post('/allocations/allocate', authenticate, adminOnly, allocCtrl.allocate);
router.post('/allocations/vacate',   authenticate, adminOnly, allocCtrl.vacate);
router.get ('/allocations/history',  authenticate, adminOnly, allocCtrl.history);

router.post('/bulk/rooms', authenticate, adminOnly, upload.single('file'), bulkCtrl.bulkRooms);
router.post('/bulk/allocations', authenticate, adminOnly, upload.single('file'), bulkCtrl.bulkAllocations);

router.get   ('/mess-menu',           authenticate, messCtrl.getAll);
router.put   ('/mess-menu',           authenticate, wardenOrAdmin, messCtrl.update);

router.get   ('/visitors',            authenticate, wardenOrAdmin, visitorCtrl.getAll);
router.post  ('/visitors',            authenticate, wardenOrAdmin, visitorCtrl.create);
router.put   ('/visitors/:id/exit',   authenticate, wardenOrAdmin, visitorCtrl.markExit);
router.delete('/visitors/:id',        authenticate, adminOnly, visitorCtrl.remove);

module.exports = router;
