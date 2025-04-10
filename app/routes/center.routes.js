const { authJwt } = require("../middlewares");
const controller = require("../controllers/center.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Get all centers
  app.get(
    "/api/centers",
    [authJwt.verifyToken],
    controller.getAllCenters
  );

  // Get center by ID
  app.get(
    "/api/centers/:id",
    [authJwt.verifyToken],
    controller.getCenterById
  );

  // Create new center (Officer only)
  app.post(
    "/api/centers",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.createCenter
  );

  // Update center (Officer only)
  app.put(
    "/api/centers/:id",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.updateCenter
  );

  // Get center's daily schedule (Officer only)
  app.get(
    "/api/centers/:id/schedule",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCenterSchedule
  );

  // Get center statistics (Officer only)
  app.get(
    "/api/centers/:id/stats",
    [authJwt.verifyToken, authJwt.isOfficer],
    controller.getCenterStats
  );
};
