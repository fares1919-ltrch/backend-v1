const { authJwt } = require("../middlewares");
const controller = require("../controllers/center.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Center:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - region
 *         - capacity
 *         - workingHours
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the center
 *         name:
 *           type: string
 *           description: Name of the center
 *         address:
 *           type: object
 *           required:
 *             - street
 *             - city
 *             - state
 *             - postalCode
 *             - lat
 *             - lon 
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             postalCode:
 *               type: string
 *             lat:
 *               type: number 
 *             lon:
 *               type: number
 *         region:
 *           type: string
 *           description: Region where the center is located
 *         capacity:
 *           type: object
 *           required:
 *             - daily
 *             - hourly
 *           properties:
 *             daily:
 *               type: integer
 *               description: Daily capacity of the center
 *             hourly:
 *               type: integer
 *               description: Hourly capacity of the center
 *         workingHours:
 *           type: object
 *           required:
 *             - monday
 *             - tuesday
 *             - wednesday
 *             - thursday
 *             - friday
 *           properties:
 *             monday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *             tuesday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *             wednesday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *             thursday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *             friday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *             saturday:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *             sunday:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *         status:
 *           type: string
 *           enum: ["active", "inactive", "maintenance"]
 *           default: "active"
 *         contact:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *         services:
 *           type: array
 *           items:
 *             type: string
 *             enum: ["cpf", "biometric", "document"]
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
   * /api/centers:
   *   get:
   *     summary: Get all centers
   *     tags: [Centers]
   *     responses:
   *       200:
   *         description: List of centers
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 centers:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Center'
   */
  app.get(
    "/api/centers",
    controller.getAllCenters
  );

  /**
   * @swagger
   * /api/centers:
   *   post:
   *     summary: Create new center (Officer only)
   *     tags: [Centers]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Center'
   *     responses:
   *       201:
   *         description: Center created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Center'
   *       400:
   *         description: Missing required fields
   *       403:
   *         description: Not authorized
   */
  app.post(
    "/api/centers",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.createCenter
  );

  /**
   * @swagger
   * /api/centers/{id}:
   *   get:
   *     summary: Get center by ID
   *     tags: [Centers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Center information
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Center'
   *       404:
   *         description: Center not found
   */
  app.get(
    "/api/centers/:id",
    controller.getCenterById
  );

  /**
   * @swagger
   * /api/centers/{id}:
   *   put:
   *     summary: Update center (Officer only)
   *     tags: [Centers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Center'
   *     responses:
   *       200:
   *         description: Center updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Center'
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Center not found
   */
  app.put(
    "/api/centers/:id",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.updateCenter
  );

  /**
   * @swagger
   * /api/centers/{id}/schedule:
   *   get:
   *     summary: Get center's daily schedule (Officer only)
   *     tags: [Centers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *         description: Optional date to get schedule for
   *     responses:
   *       200:
   *         description: List of appointments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   userId:
   *                     type: string
   *                   date:
   *                     type: string
   *                     format: date-time
   *                   status:
   *                     type: string
   *                   user:
   *                     type: object
   *                     properties:
   *                       username:
   *                         type: string
   *                       firstName:
   *                         type: string
   *                       lastName:
   *                         type: string
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/centers/:id/schedule",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCenterSchedule
  );

  /**
   * @swagger
   * /api/centers/{id}/stats:
   *   get:
   *     summary: Get center statistics (Officer only)
   *     tags: [Centers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for statistics
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for statistics
   *     responses:
   *       200:
   *         description: Center statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 centerId:
   *                   type: string
   *                 period:
   *                   type: object
   *                   properties:
   *                     start:
   *                       type: string
   *                       format: date
   *                     end:
   *                       type: string
   *                       format: date
   *                 stats:
   *                   type: object
   *                   properties:
   *                     totalAppointments:
   *                       type: integer
   *                     completed:
   *                       type: integer
   *                     rescheduled:
   *                       type: integer
   *                     noShow:
   *                       type: integer
   *                     averageProcessingTime:
   *                       type: integer
   *                       description: Average processing time in minutes
   *                     biometricCollectionSuccess:
   *                       type: number
   *                       format: float
   *                       description: Biometric collection success rate in percentage
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Center not found
   */
  app.get(
    "/api/centers/:id/stats",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCenterStats
  );
};
