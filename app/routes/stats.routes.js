const { authJwt } = require("../middlewares");
const controller = require("../controllers/stats.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Get CPF request statistics (Officer only)
  app.get(
    "/api/stats/cpf-requests",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCpfRequestStats
  );

  // Get biometric collection statistics (Officer only)
  app.get(
    "/api/stats/biometric-data",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getBiometricStats
  );

  // Get appointment statistics (Officer only)
  app.get(
    "/api/stats/appointments",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getAppointmentStats
  );

  // Get regional statistics (Officer only)
  app.get(
    "/api/stats/regions",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getRegionalStats
  );

  // Get system overview statistics (Officer only)
  app.get(
    "/api/stats/overview",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getSystemOverview
  );
};
