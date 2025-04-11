const { authJwt } = require("../middlewares");
const controller = require("../controllers/biometricData.controller");

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
