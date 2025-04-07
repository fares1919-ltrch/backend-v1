const { authJwt } = require("../middlewares");
const controller = require("../controllers/password.controller");
const rateLimit = require("express-rate-limit");

// Create a limiter for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    message:
      "Too many password reset requests from this IP, please try again after an hour",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Forgot password (public) with rate limiting
  app.post(
    "/api/password/forgot",
    passwordResetLimiter,
    controller.forgotPassword
  );

  // Reset password (public)
  app.post("/api/password/reset", controller.resetPassword);

  // Change password (requires authentication)
  app.post(
    "/api/password/change",
    [authJwt.verifyToken],
    controller.changePassword
  );
};
