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

  // Issue new CPF credential (officer only)
  app.post(
    "/api/cpf-credentials",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.issue
  );

  // Get user's CPF credential
  app.get(
    "/api/cpf-credentials/:userId",
    [authJwt.verifyToken],
    controller.getUserCredential
  );
};
