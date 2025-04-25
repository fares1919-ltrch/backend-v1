const { authJwt } = require("../middlewares");
const controller = require("../controllers/cpfRequest.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     CPFRequest:
 *       type: object
 *       required:
 *         - identityNumber
 *         - address
 *         - centerId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user making the request
 *         identityNumber:
 *           type: string
 *           description: Identity number for CPF issuance
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             postalCode:
 *               type: string
 *             country:
 *               type: string
 *             lat:
 *               type: number
 *               description: Latitude coordinate
 *               required: true
 *             lon:
 *               type: number
 *               description: Longitude coordinate
 *               required: true
 *         cost:
 *           type: string
 *           description: Cost of the CPF request
 *           default: "7.09 BRL"
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, completed]
 *           default: pending
 *           description: Current status of the CPF request
 *         officerDecision:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [pending, approved, rejected]
 *               default: pending
 *             comment:
 *               type: string
 *               description: Officer's comments on the decision
 *             decidedAt:
 *               type: string
 *               format: date-time
 *               description: When the decision was made
 *             decidedBy:
 *               type: string
 *               description: ID of the officer who made the decision
 *         appointmentDate:
 *           type: string
 *           format: date-time
 *           description: Date and time of the appointment
 *         centerId:
 *           type: string
 *           description: ID of the center where the CPF request will be processed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the request was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the request was last updated
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
   * /api/cpf-requests:
   *   post:
   *     summary: Create a new CPF request
   *     tags: [CPF Requests]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CPFRequest'
   *     responses:
   *       201:
   *         description: CPF request created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CPFRequest'
   */
  app.post(
    "/api/cpf-requests",
    [authJwt.verifyToken],
    controller.create
  );

  /**
   * @swagger
   * /api/cpf-requests:
   *   get:
   *     summary: Get all CPF requests (with filtering)
   *     tags: [CPF Requests]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, approved, rejected]
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
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
   *     responses:
   *       200:
   *         description: List of CPF requests
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 requests:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/CPFRequest'
   *                 totalPages:
   *                   type: integer
   *                 currentPage:
   *                   type: integer
   */
  app.get(
    "/api/cpf-requests",
    [authJwt.verifyToken],
    controller.findAll
  );

  /**
   * @swagger
   * /api/cpf-requests/user:
   *   get:
   *     summary: Get user's own CPF request status
   *     tags: [CPF Requests]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's CPF request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CPFRequest'
   *       404:
   *         description: No CPF request found for user
   */
  app.get(
    "/api/cpf-requests/user",
    [authJwt.verifyToken],
    controller.getUserRequest
  );

  /**
   * @swagger
   * /api/cpf-requests/pending:
   *   get:
   *     summary: Get all pending CPF requests (officer only)
   *     tags: [CPF Requests]
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
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [createdAt, updatedAt]
   *           default: createdAt
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *     responses:
   *       200:
   *         description: List of pending CPF requests
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 requests:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/CPFRequest'
   *                 totalPages:
   *                   type: integer
   *                 currentPage:
   *                   type: integer
   *       403:
   *         description: Not authorized to view pending requests
   */
  app.get(
    "/api/cpf-requests/pending",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getPendingRequests
  );

  

  /**
   * @swagger
   * /api/cpf-requests/{id}/status:
   *   put:
   *     summary: Update CPF request status (officer only)
   *     tags: [CPF Requests]
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
   *                 enum: [approved, rejected]
   *               officerNotes:
   *                 type: string
   *     responses:
   *       200:
   *         description: CPF request status updated
   *       403:
   *         description: Not authorized to update request status
   *       404:
   *         description: CPF request not found
   */
  app.put(
    "/api/cpf-requests/:id/status",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.updateDecision
  );


app.get(
  "/api/cpf-requests/getPending",
  [authJwt.verifyToken],
  controller.PendingReq
);



app.get(
  "/api/cpf-requests/:id",
  [authJwt.verifyToken],
  controller.findOne
);

/**
 * @swagger
 * /api/cpf-requests/{id}:
 *   delete:
 *     summary: Delete CPF request (user can only delete their own pending requests)
 *     tags: [CPF Requests]
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
 *         description: CPF request deleted successfully
 *       403:
 *         description: Not authorized to delete this request
 *       404:
 *         description: CPF request not found
 *       400:
 *         description: Only pending requests can be deleted
 */

/**
 * @swagger
 * /api/cpf-requests/{requestId}/delete:
 *   delete:
 *     summary: Delete a CPF request by ID
 *     tags: [CPF Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CPF request deleted successfully
 *       404:
 *         description: CPF request not found
 *       500:
 *         description: Server error
 */
app.delete(
  "/api/cpf-requests/:requestId/delete",
  [authJwt.verifyToken, authJwt.isOfficer],
  controller.deleteRequest
);














};






