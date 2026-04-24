const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const protect = require('../middleware/authMiddleware');

router.use(protect); // All routes protected

router.get('/today', attendanceController.getTodayStatus);
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/history', attendanceController.getHistory);

module.exports = router;
