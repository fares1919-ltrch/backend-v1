const { authJwt } = require("../middlewares");
const controller = require("../controllers/biometricData.controller");

/**
 * @swagger
 * components:
 *   schemas:
 *     BiometricData:
 *       type: object
 *       required:
 *         - userId
 *         - appointmentId
 *         - officerId
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user this biometric data belongs to
 *         appointmentId:
 *           type: string
 *           description: ID of the appointment during which the data was collected
 *         officerId:
 *           type: string
 *           description: ID of the officer who collected the data
 *         fingerprints:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               finger:
 *                 type: string
 *                 enum: [right_thumb, right_index, right_middle, right_ring, right_little, left_thumb, left_index, left_middle, left_ring, left_little]
 *               data:
 *                 type: string
 *                 description: Base64 encoded fingerprint data
 *               format:
 *                 type: string
 *                 enum: [WSQ, JPEG2000, PNG]
 *               quality:
 *                 type: number
 *                 description: Quality score 0-100
 *               dpi:
 *                 type: number
 *               capturedAt:
 *                 type: string
 *                 format: date-time
 *         face:
 *           type: object
 *           properties:
 *             data:
 *               type: string
 *               description: Base64 encoded photo
 *             format:
 *               type: string
 *               enum: [JPEG, PNG]
 *             quality:
 *               type: number
 *               description: Quality score 0-100
 *             attributes:
 *               type: object
 *               properties:
 *                 width:
 *                   type: number
 *                 height:
 *                   type: number
 *                 hasNeutralExpression:
 *                   type: boolean
 *                 hasUniformBackground:
 *                   type: boolean
 *                 hasProperLighting:
 *                   type: boolean
 *             capturedAt:
 *               type: string
 *               format: date-time
 *         iris:
 *           type: object
 *           properties:
 *             right:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: Base64 encoded iris data
 *                 quality:
 *                   type: number
 *                 format:
 *                   type: string
 *                   enum: [ISO-19794-6, JPEG2000]
 *                 capturedAt:
 *                   type: string
 *                   format: date-time
 *             left:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: Base64 encoded iris data
 *                 quality:
 *                   type: number
 *                 format:
 *                   type: string
 *                   enum: [ISO-19794-6, JPEG2000]
 *                 capturedAt:
 *                   type: string
 *                   format: date-time
 *         supportingDocuments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [identity_card, passport, birth_certificate, other]
 *               documentNumber:
 *                 type: string
 *               issuingAuthority:
 *                 type: string
 *               data:
 *                 type: string
 *                 description: Base64 encoded document scan
 *               format:
 *                 type: string
 *                 enum: [PDF, JPEG, PNG]
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *         verificationStatus:
 *           type: string
 *           enum: [pending, verified, failed, requires_review]
 *           default: pending
 *         verificationDetails:
 *           type: object
 *           properties:
 *             verifiedBy:
 *               type: string
 *               description: ID of the user who verified the data
 *             verifiedAt:
 *               type: string
 *               format: date-time
 *             failureReason:
 *               type: string
 *             attempts:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                   reason:
 *                     type: string
 *         collectionMetadata:
 *           type: object
 *           properties:
 *             deviceInfo:
 *               type: object
 *               properties:
 *                 fingerprintScanner:
 *                   type: string
 *                 camera:
 *                   type: string
 *                 irisScanner:
 *                   type: string
 *             location:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   default: "Point"
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *             collectionCenter:
 *               type: string
 *             environmentConditions:
 *               type: object
 *               properties:
 *                 lighting:
 *                   type: string
 *                 temperature:
 *                   type: number
 *                 humidity:
 *                   type: number
 *         collectedAt:
 *           type: string
 *           format: date-time
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
   * /api/biometric-data:
   *   post:
   *     summary: Submit biometric data (officer only)
   *     tags: [Biometric Data]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *               fingerprints:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *               faceImage:
   *                 type: string
   *                 format: binary
   *               irisScans:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       201:
   *         description: Biometric data submitted successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User not found
   */
  app.post(
    "/api/biometric-data",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.submitBiometricData
  );

  /**
   * @swagger
   * /api/biometric-data/{userId}:
   *   get:
   *     summary: Get user's biometric data (officer only)
   *     tags: [Biometric Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User's biometric data
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Biometric data not found
   */
  app.get(
    "/api/biometric-data/:userId",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getBiometricData
  );

  /**
   * @swagger
   * /api/biometric-data/{userId}:
   *   put:
   *     summary: Update user's biometric data (officer only)
   *     tags: [Biometric Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               fingerprints:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *               faceImage:
   *                 type: string
   *                 format: binary
   *               irisScans:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *     responses:
   *       200:
   *         description: Biometric data updated successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User or biometric data not found
   */
  app.put(
    "/api/biometric-data/:userId",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.updateBiometricData
  );

  /**
   * @swagger
   * /api/biometric-data/{userId}:
   *   delete:
   *     summary: Delete user's biometric data (officer only)
   *     tags: [Biometric Data]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Biometric data deleted successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Biometric data not found
   */
  app.delete(
    "/api/biometric-data/:userId",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.deleteBiometricData
  );

  /**
   * @swagger
   * /api/biometric-data/{id}/verify:
   *   post:
   *     summary: Verify biometric data quality (officer only)
   *     tags: [Biometric Data]
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
   *         description: Verification result
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Biometric data not found
   */
  app.post(
    "/api/biometric-data/:id/verify",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.verifyBiometricData
  );

  /**
   * @swagger
   * /api/biometric-data/stats/collection-centers:
   *   get:
   *     summary: Get collection center statistics (officer only)
   *     tags: [Biometric Data]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Collection center statistics
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/biometric-data/stats/collection-centers",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCollectionCenterStats
  );
};
