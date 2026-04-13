const express = require('express');
const router = express.Router();
const { authenticate, wardenOrAdmin } = require('../../middleware/auth');
const leaveCtrl = require('../../controllers/leaveController');
const hostelAppCtrl = require('../../controllers/hostelApplicationController');
const requestCtrl = require('../../controllers/requestController');

router.get   ('/leaves',              authenticate, leaveCtrl.getAll);
router.post  ('/leaves',              authenticate, leaveCtrl.create);
router.put   ('/leaves/:id/status',   authenticate, wardenOrAdmin, leaveCtrl.updateStatus);
router.delete('/leaves/:id',          authenticate, leaveCtrl.remove);

router.get ('/hostel-applications',          authenticate, wardenOrAdmin, hostelAppCtrl.getAll);
router.put ('/hostel-applications/:id',      authenticate, wardenOrAdmin, hostelAppCtrl.review);

router.get ('/requests',          authenticate, wardenOrAdmin, requestCtrl.getAll);
router.put ('/requests/:id',      authenticate, wardenOrAdmin, requestCtrl.review);

module.exports = router;
