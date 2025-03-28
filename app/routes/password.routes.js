const { authJwt } = require("../middlewares");
const controller = require("../controllers/password.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Forgot password (public)
  app.post("/api/password/forgot", controller.forgotPassword);

  // Reset password (public)
  app.post("/api/password/reset", controller.resetPassword);

  // Change password (requires authentication)
  app.post(
    "/api/password/change",
    [authJwt.verifyToken],
    controller.changePassword
  );
};
