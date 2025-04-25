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
 *           description: Name of the CPF processing center
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
 *               description: Street address of the center
 *             city:
 *               type: string
 *               description: City where the center is located
 *             state:
 *               type: string
 *               description: State where the center is located
 *             postalCode:
 *               type: string
 *               description: Postal/ZIP code of the center
 *             lat:
 *               type: number
 *               description: Latitude coordinate for map location 
 *             lon:
 *               type: number
 *               description: Longitude coordinate for map location
 *         region:
 *           type: string
 *           description: Geographic region where the center is located
 *         capacity:
 *           type: object
 *           required:
 *             - daily
 *             - hourly
 *           properties:
 *             daily:
 *               type: integer
 *               description: Maximum number of appointments per day
 *             hourly:
 *               type: integer
 *               description: Maximum number of appointments per hour
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
 *                   description: Opening time on Monday (HH:MM format)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Monday (HH:MM format)
 *             tuesday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                   description: Opening time on Tuesday (HH:MM format)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Tuesday (HH:MM format)
 *             wednesday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                   description: Opening time on Wednesday (HH:MM format)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Wednesday (HH:MM format)
 *             thursday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                   description: Opening time on Thursday (HH:MM format)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Thursday (HH:MM format)
 *             friday:
 *               type: object
 *               required:
 *                 - start
 *                 - end
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                   description: Opening time on Friday (HH:MM format)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Friday (HH:MM format)
 *             saturday:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                   description: Opening time on Saturday (HH:MM format, if applicable)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Saturday (HH:MM format, if applicable)
 *             sunday:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                   description: Opening time on Sunday (HH:MM format, if applicable)
 *                 end:
 *                   type: string
 *                   format: time
 *                   description: Closing time on Sunday (HH:MM format, if applicable)
 *         status:
 *           type: string
 *           enum: ["active", "inactive", "maintenance"]
 *           default: "active"
 *           description: Current operational status of the center
 *         contact:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *               description: Contact phone number for the center
 *             email:
 *               type: string
 *               description: Contact email address for the center
 *         services:
 *           type: array
 *           items:
 *             type: string
 *             enum: ["cpf", "biometric", "document"]
 *           description: List of services provided at this center
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the center was created in the system
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the center information was last updated
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

  /**
   * @swagger
   * /api/centers/{centerId}/available-days:
   *   get:
   *     summary: Get available days for a center
   *     tags: [Centers]
   *     parameters:
   *       - in: path
   *         name: centerId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of available days
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   date:
   *                     type: string
   *                     format: date
   *                   availableSlots:
   *                     type: integer
   */
  app.get(
    "/api/centers/:centerId/available-days",
    controller.getAvailableDays
  );
};
