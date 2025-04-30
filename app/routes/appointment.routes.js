const { authJwt } = require("../middlewares");
const controller = require("../controllers/appointment.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - userId
 *         - officerId
 *         - cpfRequestId
 *         - appointmentDate
 *         - location
 *       properties:
 *         userId:
 *           type: string
 *           description: The ID of the user who has the appointment
 *         officerId:
 *           type: string
 *           description: The ID of the officer assigned to the appointment
 *         cpfRequestId:
 *           type: string
 *           description: The ID of the associated CPF request
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *           description: The date and time of the appointment
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, missed]
 *           default: scheduled
 *           description: Current status of the appointment
 *         notes:
 *           type: string
 *           description: Additional notes for the appointment
 *         location:
 *           type: string
 *           description: ID of the center where the appointment will take place
 *         checkInTime:
 *           type: string
 *           format: date-time
 *           description: When the user checked in for the appointment
 *         completedTime:
 *           type: string
 *           format: date-time
 *           description: When the appointment was completed
 *         cancelledTime:
 *           type: string
 *           format: date-time
 *           description: When the appointment was cancelled
 *         cancellationReason:
 *           type: string
 *           description: Reason for cancellation if applicable
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
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
   * /api/appointments/user:
   *   get:
   *     summary: Get user's own appointments
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's appointments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Appointment'
   */
  app.get(
    "/api/appointments/user",
    [authJwt.verifyToken],
    controller.getUserAppointment
  );

  
  

  /**
   * @swagger
   * /api/appointments/officer/{officerId}:
   *   get:
   *     summary: Get officer's appointments
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: officerId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of officer's appointments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Appointment'
   */
  app.get(
    "/api/appointments/officer/:officerId",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getOfficerAppointments
  );

  /**
   * @swagger
   * /api/appointments/{id}/status:
   *   put:
   *     summary: Update appointment status (officer only)
   *     tags: [Appointments]
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
   *             type: object
   *             required:
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [completed, cancelled, missed]
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Appointment status updated
   */
  app.put(
    "/api/appointments/:id/status",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.updateStatus
  );

  /**
   * @swagger
   * /api/appointments/by-request/{cpfRequestId}:
   *   get:
   *     summary: Get appointment by CPF request ID
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: cpfRequestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Appointment details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Appointment'
   */
  app.get(
    "/api/appointments/by-request/:cpfRequestId",
    [authJwt.verifyToken],
    controller.getAppointmentByRequestId
  );

  /**
   * @swagger
   * /api/appointments/{id}/reschedule:
   *   put:
   *     summary: Reschedule appointment
   *     tags: [Appointments]
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
   *             type: object
   *             required:
   *               - newDateTime
   *             properties:
   *               newDateTime:
   *                 type: string
   *                 format: date-time
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Appointment rescheduled successfully
   */
  app.put(
    "/api/appointments/:id/reschedule",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.rescheduleAppointment
  );

  /**
   * @swagger
   * /api/appointments/center/{centerId}/daily:
   *   get:
   *     summary: Get center's daily appointments (officer only)
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: centerId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: date
   *         schema:
   *           type: string
   *           format: date
   *     responses:
   *       200:
   *         description: List of center's daily appointments
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Appointment'
   */
  app.get(
    "/api/appointments/center/:centerId/daily",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getCenterDailyAppointments
  );

  /**
   * @swagger
   * /api/appointments/{id}:
   *   delete:
   *     summary: Delete appointment (officer only)
   *     tags: [Appointments]
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
   *         description: Appointment deleted successfully
   *       403:
   *         description: Only officers can delete appointments
   */
  app.delete(
    "/api/appointments/:id",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.deleteAppointment
  );

  /**
   * @swagger
   * /api/appointments/check-and-create/{requestId}:
   *   post:
   *     summary: Check availability and create appointment for a CPF request
   *     tags: [Appointments]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the CPF request
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - dateTime
   *             properties:
   *               dateTime:
   *                 type: string
   *                 format: date-time
   *                 description: Proposed appointment date and time
   *     responses:
   *       200:
   *         description: Appointment created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 appointment:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     date:
   *                       type: string
   *                       format: date-time
   *                     center:
   *                       type: string
   *                     status:
   *                       type: string
   *                     cpfRequest:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                         status:
   *                           type: string
   *       400:
   *         description: Time slot not available or outside working hours
   *       404:
   *         description: CPF request or center not found
   */
  app.post(
    "/api/appointments/check-and-create/:requestId",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.checkAndCreateAppointment
  );

 
  app.post(
    "/api/appointments/createScheduleAppointment/:requestId",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.create
  );

  app.put(
    "/api/appointments/reschedule/:requestId",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.rescheduleAppointment
  );


  app.get('/api/appointments/today',
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getTodayAppointments
  );

  app.get('/api/appointments/upcoming',
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getUpcomingAppointments
  );

  app.put('/api/appointments/cancel/:appointmentId',
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.cancelAppointment
  );

  app.put('/api/appointments/complete/:appointmentId',
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.completeAppointment
  );

  app.put('/api/appointments/missed/:appointmentId',
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.missAppointment
  );
};
