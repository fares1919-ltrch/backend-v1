const { authJwt } = require("../middlewares");
const controller = require("../controllers/appointment.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Create new appointment (officer only)
  app.post(
    "/api/appointments",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.create
  );

  // Get officer's appointments
  app.get(
    "/api/appointments/officer/:officerId",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getOfficerAppointments
  );

  // Get user's appointment
  app.get(
    "/api/appointments/:userId",
    [authJwt.verifyToken],
    controller.getUserAppointment
  );

  // Update appointment status
  app.put(
    "/api/appointments/:id",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.updateStatus
  );
};
