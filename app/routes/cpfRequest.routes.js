const { authJwt } = require("../middlewares");
const controller = require("../controllers/cpfRequest.controller");
const upload = require("../middlewares/upload");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Create a new CPF request
  app.post(
    "/api/cpf-requests",
    [
      authJwt.verifyToken,
      upload.array("attachments", 5) // Allow up to 5 attachments
    ],
    controller.create
  );

  // Get user's CPF request status
  app.get(
    "/api/cpf-requests/:userId",
    [authJwt.verifyToken],
    controller.getUserRequest
  );

  // Get all pending CPF requests (officer only)
  app.get(
    "/api/cpf-requests/pending",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getPendingRequests
  );
};
