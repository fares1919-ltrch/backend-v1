const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const refreshTokenController = require("../controllers/refreshToken.controller");
const passport = require("passport");
const rateLimit = require("express-rate-limit");

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

  /**
   * @swagger
   * /api/auth/google:
   *   get:
   *     summary: Initiate Google OAuth authentication
   *     tags: [Authentication]
   *     responses:
   *       302:
   *         description: Redirects to Google login
   */
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  /**
   * @swagger
   * /api/auth/google/callback:
   *   get:
   *     summary: Google OAuth callback URL
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Authentication failed
   */
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

  /**
   * @swagger
   * /api/auth/google/failure:
   *   get:
   *     summary: Google OAuth failure endpoint
   *     tags: [Authentication]
   *     responses:
   *       401:
   *         description: Google authentication failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */
  app.get("/api/auth/google/failure", (req, res) => {
    res.status(401).json({
      message: "Google authentication failed",
      error: req.query.error || "Unknown error",
    });
  });

  /**
   * @swagger
   * /api/auth/github:
   *   get:
   *     summary: Initiate GitHub OAuth authentication
   *     tags: [Authentication]
   *     responses:
   *       302:
   *         description: Redirects to GitHub login
   */
  app.get(
    "/api/auth/github",
    passport.authenticate("github", { scope: ["user:email"] })
  );

  /**
   * @swagger
   * /api/auth/github/callback:
   *   get:
   *     summary: GitHub OAuth callback URL
   *     tags: [Authentication]
   *     responses:
   *       200:
   *         description: Authentication successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Authentication failed
   */
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

  /**
   * @swagger
   * /api/auth/github/failure:
   *   get:
   *     summary: GitHub OAuth failure endpoint
   *     tags: [Authentication]
   *     responses:
   *       401:
   *         description: GitHub authentication failed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */
  app.get("/api/auth/github/failure", (req, res) => {
    res.status(401).json({
      message: "GitHub authentication failed",
      error: req.query.error || "Unknown error",
    });
  });
};
