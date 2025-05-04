const controller = require("../controllers/email-verification.controller");
const { verifyToken } = require("../middlewares/authJwt");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Verify email with token
  app.get("/api/auth/verify-email", controller.verifyEmail);
  
  // Resend verification email (protected route)
  app.post(
    "/api/auth/resend-verification", 
    [verifyToken], 
    controller.resendVerificationEmail
  );
  
  // Public route to resend verification email (no token required)
  app.post("/api/auth/public-resend-verification", controller.resendVerificationEmail);
};
