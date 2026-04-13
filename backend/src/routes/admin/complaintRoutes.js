const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../../middleware/auth');
const complaintCtrl = require('../../controllers/complaintController');
const noticeCtrl = require('../../controllers/noticeController');
const messageCtrl = require('../../controllers/messageController');

router.get   ('/complaints',         authenticate, adminOnly, complaintCtrl.getAll);
router.post  ('/complaints',         authenticate, adminOnly, complaintCtrl.create);
router.put   ('/complaints/:id',     authenticate, adminOnly, complaintCtrl.updateStatus);
router.delete('/complaints/:id',     authenticate, adminOnly, complaintCtrl.remove);

router.get   ('/notices',     authenticate, noticeCtrl.getAll);
router.post  ('/notices',     authenticate, adminOnly, noticeCtrl.create);
router.delete('/notices/:id', authenticate, adminOnly, noticeCtrl.remove);

router.get ('/messages/admin/all',          authenticate, adminOnly, messageCtrl.adminGetAllMessages);
router.post('/messages/admin/send',         authenticate, adminOnly, messageCtrl.adminSendMessage);
router.put ('/messages/admin/:id/status',   authenticate, adminOnly, messageCtrl.adminUpdateMessage);
router.delete('/messages/admin/:id',        authenticate, adminOnly, messageCtrl.adminDeleteMessage);

module.exports = router;
