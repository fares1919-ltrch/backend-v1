const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Notification ID
 *         userId:
 *           type: string
 *           description: ID of the user this notification belongs to
 *         type:
 *           type: string
 *           enum: [info, warning, success, error]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         read:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 */

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  /**
   * @swagger
   * /api/notifications:
   *   post:
   *     summary: Send notification to user (officer only)
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - title
   *               - message
   *               - type
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user to send notification to
   *               title:
   *                 type: string
   *                 description: Notification title
   *               message:
   *                 type: string
   *                 description: Notification message
   *               type:
   *                 type: string
   *                 enum: [info, warning, success, error]
   *                 description: Type of notification
   *     responses:
   *       201:
   *         description: Notification sent successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User not found
   */
  app.post(
    "/api/notifications",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.sendNotification
  );

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: Get user's notifications
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Number of items per page
   *       - in: query
   *         name: read
   *         schema:
   *           type: boolean
   *         description: Filter by read status
   *     responses:
   *       200:
   *         description: List of notifications
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 notifications:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Notification'
   *                 totalPages:
   *                   type: integer
   *                 currentPage:
   *                   type: integer
   *                 totalNotifications:
   *                   type: integer
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/notifications",
    [authJwt.verifyToken],
    controller.getNotifications
  );

  /**
   * @swagger
   * /api/notifications/{id}/read:
   *   put:
   *     summary: Mark notification as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Notification marked as read
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Notification not found
   */
  app.put(
    "/api/notifications/:id/read",
    [authJwt.verifyToken],
    controller.markAsRead
  );

  /**
   * @swagger
   * /api/notifications/read-all:
   *   put:
   *     summary: Mark all notifications as read
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: All notifications marked as read
   *       403:
   *         description: Not authorized
   */
  app.put(
    "/api/notifications/read-all",
    [authJwt.verifyToken],
    controller.markAllAsRead
  );

  /**
   * @swagger
   * /api/notifications/unread-count:
   *   get:
   *     summary: Get count of unread notifications
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Number of unread notifications
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 count:
   *                   type: integer
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/notifications/unread-count",
    [authJwt.verifyToken],
    controller.getUnreadCount
  );

  /**
   * @swagger
   * /api/notifications/{id}:
   *   delete:
   *     summary: Delete a notification
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Notification deleted successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Notification not found
   */
  app.delete(
    "/api/notifications/:id",
    [authJwt.verifyToken],
    controller.deleteNotification
  );
};
