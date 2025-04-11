const { authJwt } = require("../middlewares");
const controller = require("../controllers/cpfCredential.controller");

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
   * /api/cpf-credentials:
   *   post:
   *     summary: Issue a new CPF credential (officer only)
   *     tags: [CPF Credentials]
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
   *             properties:
   *               userId:
   *                 type: string
   *                 description: ID of the user to issue credential for
   *     responses:
   *       201:
   *         description: CPF credential issued successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: User not found
   */
  app.post(
    "/api/cpf-credentials",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.issueCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/{userId}:
   *   get:
   *     summary: Get user's CPF credential (officer/user)
   *     tags: [CPF Credentials]
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
   *         description: CPF credential details
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Credential not found
   */
  app.get(
    "/api/cpf-credentials/:userId",
    [authJwt.verifyToken],
    controller.getCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/verify/{id}:
   *   get:
   *     summary: Verify CPF credential authenticity
   *     tags: [CPF Credentials]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Credential verification result
   *       404:
   *         description: Credential not found
   */
  app.get(
    "/api/cpf-credentials/verify/:id",
    controller.verifyCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/{id}/revoke:
   *   put:
   *     summary: Revoke a CPF credential (officer only)
   *     tags: [CPF Credentials]
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
   *               - reason
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Reason for revoking the credential
   *     responses:
   *       200:
   *         description: Credential revoked successfully
   *       403:
   *         description: Not authorized
   *       404:
   *         description: Credential not found
   */
  app.put(
    "/api/cpf-credentials/:id/revoke",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.revokeCpfCredential
  );

  /**
   * @swagger
   * /api/cpf-credentials/stats:
   *   get:
   *     summary: Get CPF credentials statistics (officer only)
   *     tags: [CPF Credentials]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: CPF credentials statistics
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: number
   *                 active:
   *                   type: number
   *                 revoked:
   *                   type: number
   *                 issuedToday:
   *                   type: number
   *       403:
   *         description: Not authorized
   */
  app.get(
    "/api/cpf-credentials/stats",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCredentialStats
  );
};
