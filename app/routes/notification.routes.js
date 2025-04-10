const { authJwt } = require("../middlewares");
const controller = require("../controllers/notification.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Send notification to user (officer only)
  app.post(
    "/api/notifications",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.sendNotification
  );
};
