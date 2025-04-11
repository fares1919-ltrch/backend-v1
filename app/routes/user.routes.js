const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         username:
 *           type: string
 *           description: Username
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, officer, manager]
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
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
   * /api/test/all:
   *   get:
   *     summary: Public content access
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: Public content
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  app.get("/api/test/all", controller.allAccess);

  /**
   * @swagger
   * /api/test/user:
   *   get:
   *     summary: User content access
   *     tags: [Test]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User content
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       403:
   *         description: Unauthorized access
   */
  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);

  /**
   * @swagger
   * /api/test/manager:
   *   get:
   *     summary: Manager content access
   *     tags: [Test]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Manager content
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       403:
   *         description: Unauthorized access
   */
  app.get(
    "/api/test/manager",
    [authJwt.verifyToken, authJwt.isManager],
    controller.managerBoard
  );

  /**
   * @swagger
   * /api/test/officer:
   *   get:
   *     summary: Officer content access
   *     tags: [Test]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Officer content
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       403:
   *         description: Unauthorized access
   */
  app.get(
    "/api/test/officer",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.officerBoard
  );

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users (admin/officer only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *       - in: query
   *         name: role
   *         schema:
   *           type: string
   *           enum: [user, officer, manager]
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, suspended]
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 users:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/UserProfile'
   *                 totalPages:
   *                   type: integer
   *                 currentPage:
   *                   type: integer
   *       403:
   *         description: Not authorized to view users
   */
  app.get(
    "/api/users",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getAllUsers
  );

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get user by ID (admin/officer only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserProfile'
   *       403:
   *         description: Not authorized to view user details
   *       404:
   *         description: User not found
   */
  app.get(
    "/api/users/:id",
    [authJwt.verifyToken, authJwt.isManagerOrOfficer],
    controller.getUserById
  );

  /**
   * @swagger
   * /api/users/{id}/status:
   *   put:
   *     summary: Update user status (admin/manager only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [active, inactive, suspended]
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: User status updated successfully
   *       403:
   *         description: Not authorized to update user status
   *       404:
   *         description: User not found
   */
  app.put(
    "/api/users/:id/status",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateUserStatus
  );

  /**
   * @swagger
   * /api/users/{id}/role:
   *   put:
   *     summary: Update user role (admin/manager only)
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - roles
   *             properties:
   *               roles:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [user, officer, manager]
   *     responses:
   *       200:
   *         description: User role updated successfully
   *       403:
   *         description: Not authorized to update user role
   *       404:
   *         description: User not found
   */
  app.put(
    "/api/users/:id/role",
    [authJwt.verifyToken, authJwt.isManager],
    controller.updateUserRole
  );

  /**
   * @swagger
   * /api/users/profile:
   *   get:
   *     summary: Get current user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserProfile'
   */
  app.get(
    "/api/users/profile",
    [authJwt.verifyToken],
    controller.getUserProfile
  );

  /**
   * @swagger
   * /api/users/profile:
   *   put:
   *     summary: Update current user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               currentPassword:
   *                 type: string
   *                 format: password
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       400:
   *         description: Invalid input or current password incorrect
   */
  app.put(
    "/api/users/profile",
    [authJwt.verifyToken],
    controller.updateUserProfile
  );
};
