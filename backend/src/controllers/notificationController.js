const { query } = require('../config/db');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');

/**
 * Controller for In-App User Notifications
 */
class NotificationController {
  /**
   * Get notifications for the current authenticated user
   * GET /api/notifications
   */
  async getUserNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 30, unreadOnly = false, scope } = req.query;

      let sql = `
        SELECT 
          id,
          user_id,
          title,
          message,
          type,
          is_read,
          link,
          created_at
        FROM notifications
        WHERE 1=1
      `;
      const params = [];

      // If scope is 'all' and user is ADMIN, can view all notifications
      if (scope === 'all' && req.user.role_name === 'ADMIN') {
        // Admin viewing all system notifications
      } else {
        sql += ` AND user_id = ?`;
        params.push(userId);
      }

      if (unreadOnly === 'true' || unreadOnly === '1') {
        sql += ` AND is_read = FALSE`;
      }

      sql += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(parseInt(limit, 10));

      const notifications = await query(sql, params);

      // Unread count specifically for the logged in user
      const unreadCountResult = await query(
        `SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );
      const unreadCount = unreadCountResult[0]?.unread_count || 0;

      return sendSuccess(res, 'Notifications retrieved successfully', {
        notifications,
        unreadCount,
        total: notifications.length
      });
    } catch (err) {
      console.error('[NotificationController] Error retrieving notifications:', err);
      return sendError(res, 'Failed to retrieve notifications', 500);
    }
  }

  /**
   * Mark a specific notification as read
   * PATCH /api/notifications/:id/read
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);

      if (!notificationId || isNaN(notificationId)) {
        return sendError(res, 'Invalid notification ID', 400);
      }

      const isAdmin = req.user.role_name === 'ADMIN';
      let sql = `UPDATE notifications SET is_read = TRUE WHERE id = ?`;
      const params = [notificationId];

      if (!isAdmin) {
        sql += ` AND user_id = ?`;
        params.push(userId);
      }

      const result = await query(sql, params);

      if (result.affectedRows === 0) {
        return sendError(res, 'Notification not found or access denied', 404);
      }

      return sendSuccess(res, 'Notification marked as read');
    } catch (err) {
      console.error('[NotificationController] Error marking notification as read:', err);
      return sendError(res, 'Failed to mark notification as read', 500);
    }
  }

  /**
   * Mark all notifications for the current user as read
   * POST /api/notifications/mark-all-read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
        [userId]
      );

      return sendSuccess(res, 'All notifications marked as read');
    } catch (err) {
      console.error('[NotificationController] Error marking all notifications as read:', err);
      return sendError(res, 'Failed to mark all notifications as read', 500);
    }
  }

  /**
   * Delete a specific notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);

      if (!notificationId || isNaN(notificationId)) {
        return sendError(res, 'Invalid notification ID', 400);
      }

      const isAdmin = req.user.role_name === 'ADMIN';
      let sql = `DELETE FROM notifications WHERE id = ?`;
      const params = [notificationId];

      if (!isAdmin) {
        sql += ` AND user_id = ?`;
        params.push(userId);
      }

      const result = await query(sql, params);

      if (result.affectedRows === 0) {
        return sendError(res, 'Notification not found or access denied', 404);
      }

      return sendSuccess(res, 'Notification removed successfully');
    } catch (err) {
      console.error('[NotificationController] Error deleting notification:', err);
      return sendError(res, 'Failed to delete notification', 500);
    }
  }

  /**
   * Create a new notification
   * POST /api/notifications
   */
  async createNotification(req, res, next) {
    try {
      const { userId, title, message, type = 'INFO', link = null } = req.body;
      const targetUserId = userId || req.user.id;

      if (!title || !message) {
        return sendError(res, 'Notification title and message are required', 400);
      }

      const validTypes = ['INFO', 'SUCCESS', 'WARNING', 'ALERT'];
      const normalizedType = validTypes.includes(type?.toUpperCase()) ? type.toUpperCase() : 'INFO';

      const result = await query(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
        [targetUserId, title.trim(), message.trim(), normalizedType, link || null]
      );

      return sendCreated(res, 'Notification created successfully', {
        id: result.insertId,
        userId: targetUserId,
        title,
        message,
        type: normalizedType,
        link
      });
    } catch (err) {
      console.error('[NotificationController] Error creating notification:', err);
      return sendError(res, 'Failed to create notification', 500);
    }
  }
}

module.exports = new NotificationController();
