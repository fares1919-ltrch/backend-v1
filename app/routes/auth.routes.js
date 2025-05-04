const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const refreshTokenController = require("../controllers/refreshToken.controller");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const User = require("../models/user.model");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, officer, manager]
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 */

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per windowMs (increased from 5)
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

  /**
   * @swagger
   * /api/auth/signup:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/User'
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: User was registered successfully!
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup
  );

  /**
   * @swagger
   * /api/auth/signin:
   *   post:
   *     summary: Login to the application
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginCredentials'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Invalid credentials
   *       429:
   *         description: Too many login attempts
   */
  app.post("/api/auth/signin", loginLimiter, controller.signin);

  /**
   * @swagger
   * /api/auth/signout:
   *   post:
   *     summary: Logout from the application
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You've been signed out!
   */
  app.post("/api/auth/signout", controller.signout);

  // Special Google logout route
  app.post("/api/auth/google/signout", controller.googleLogout);

  // Refresh Token Route
  app.post("/api/auth/refreshtoken", refreshTokenController.createRefreshToken);

  // Token validation route - explicitly check if a token is valid without refreshing
  app.get("/api/auth/validate-token", async (req, res) => {
    try {
      // Get token from various sources
      const token =
        req.headers.authorization?.split(" ")[1] ||
        req.headers["x-access-token"] ||
        req.cookies?.token;

      if (!token) {
        return res.status(401).json({
          valid: false,
          message: "No token provided",
        });
      }

      // Verify token without refreshing it
      const decoded = jwt.verify(token, config.jwtSecret);

      // Check if user exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          valid: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        valid: true,
        userId: user._id,
        username: user.username,
      });
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          valid: false,
          expired: true,
          message: "Token expired",
        });
      }

      return res.status(401).json({
        valid: false,
        message: "Invalid token",
      });
    }
  });

  /**
   * @swagger
   * /api/auth/refreshtoken:
   *   post:
   *     summary: Get new access token using refresh token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *     responses:
   *       200:
   *         description: New access token generated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 refreshToken:
   *                   type: string
   *       403:
   *         description: Invalid refresh token
   */
  app.post("/api/auth/refreshtoken", refreshTokenController.createRefreshToken);

  // OAuth Routes
  // Clear any existing Google OAuth sessions before starting a new authentication flow
  app.get(
    "/api/auth/google",
    (req, res, next) => {
      // Clear any existing session data
      if (req.session) {
        req.session.destroy();
      }

      // Clear any existing cookies
      res.clearCookie("token");
      res.clearCookie("refreshToken");
      res.clearCookie("connect.sid");
      res.clearCookie("sessionId");

      next();
    },
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: true,
      prompt: "select_account", // Force Google to always show the account selection screen
      accessType: "offline", // Request a refresh token
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/api/auth/login?error=oauth_error",
      session: true,
      prompt: "select_account", // Ensure account selection is prompted
    }),
    controller.googleCallback
  );

  /* Commenting out GitHub authentication as requested
  app.get(
    "/api/auth/github",
    passport.authenticate("github", {
      scope: ["user:email", "read:user"],
      session: true,
    })
  );

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", {
      failureRedirect: "/api/auth/login?error=oauth_error",
      session: true,
    }),
    controller.githubCallback
  );
  */

  // Session check endpoint
  app.get("/api/auth/session", (req, res) => {
    if (req.session && req.session.userId) {
      res.json({
        id: req.session.userId,
        username: req.session.username,
        roles: req.session.roles,
      });
    } else {
      res.status(401).json({ message: "No active session" });
    }
  });

  // User info endpoint that works with token parameter
  app.get("/api/auth/userinfo", async (req, res) => {
    try {
      let token = null;

      // Check for token in different places
      if (req.query.token) {
        // Token in URL query parameter
        token = req.query.token;
      } else if (req.headers["x-access-token"]) {
        // Token in header
        token = req.headers["x-access-token"];
      } else if (req.cookies.token) {
        // Token in cookie
        token = req.cookies.token;
      } else if (req.session.token) {
        // Token in session
        token = req.session.token;
      }

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Get user info
      const user = await User.findById(decoded.id).populate("roles", "-__v");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Format response
      const authorities = user.roles.map(
        (role) => `ROLE_${role.name.toUpperCase()}`
      );

      return res.status(200).json({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        provider: user.provider || "local",
      });
    } catch (err) {
      console.error("Error getting user info:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  });
};
