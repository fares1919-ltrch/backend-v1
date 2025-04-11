const { authJwt } = require("../middlewares");
const controller = require("../controllers/cpfRequest.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     CPFRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - dateOfBirth
 *         - nationalId
 *         - address
 *         - phone
 *         - email
 *         - purpose
 *       properties:
 *         firstName:
 *           type: string
 *           description: First name of the applicant
 *         lastName:
 *           type: string
 *           description: Last name of the applicant
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         nationalId:
 *           type: string
 *           description: National ID number
 *         address:
 *           type: string
 *           description: Residential address
 *         phone:
 *           type: string
 *           description: Contact phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Contact email
 *         purpose:
 *           type: string
 *           description: Purpose of CPF request
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           default: pending
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
   * /api/cpf-requests/{id}:
   *   get:
   *     summary: Get CPF request by ID
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
   *         description: CPF request details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CPFRequest'
   *       404:
   *         description: CPF request not found
   */
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
  app.delete(
    "/api/cpf-requests/:id",
    [authJwt.verifyToken],
    controller.deleteRequest
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
};
