const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(requireAuth);

// 1. Get user notifications
router.get('/', (req, res, next) => notificationController.getUserNotifications(req, res, next));

// 2. Mark specific notification as read
router.patch('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.put('/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));

// 3. Mark all notifications as read
router.post('/mark-all-read', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.put('/read-all', (req, res, next) => notificationController.markAllAsRead(req, res, next));

// 4. Delete notification
router.delete('/:id', (req, res, next) => notificationController.deleteNotification(req, res, next));

// 5. Create notification (optional/manual trigger)
router.post('/', (req, res, next) => notificationController.createNotification(req, res, next));

module.exports = router;
