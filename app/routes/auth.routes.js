const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const refreshTokenController = require("../controllers/refreshToken.controller");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup
  );

  app.post("/api/auth/signin", loginLimiter, controller.signin);

  app.post("/api/auth/signout", controller.signout);

  app.post("/api/auth/refreshtoken", refreshTokenController.createRefreshToken);

  // Google OAuth Routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      session: false,
      failureRedirect: "/api/auth/google/failure",
    }),
    (req, res) => {
      try {
        const { user, token } = req.user;
        res.json({ user, token });
      } catch (error) {
        res.status(500).json({
          message: "An error occurred during Google authentication",
          error: error.message,
        });
      }
    }
  );

  app.get("/api/auth/google/failure", (req, res) => {
    res.status(401).json({
      message: "Google authentication failed",
      error: req.query.error || "Unknown error",
    });
  });

  // GitHub OAuth Routes
  app.get(
    "/api/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
  );

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", {
      session: false,
      failureRedirect: "/api/auth/github/failure",
    }),
    (req, res) => {
      try {
        const { user, token } = req.user;
        res.json({ user, token });
      } catch (error) {
        res.status(500).json({
          message: "An error occurred during GitHub authentication",
          error: error.message,
        });
      }
    }
  );

  app.get("/api/auth/github/failure", (req, res) => {
    res.status(401).json({
      message: "GitHub authentication failed",
      error: req.query.error || "Unknown error",
    });
  });
};
