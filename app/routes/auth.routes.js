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

  // Refresh Token Route
  app.post(
    "/api/auth/refreshtoken", 
    refreshTokenController.createRefreshToken
  );

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
  app.get(
    '/api/auth/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: true
    })
  );

  app.get(
    '/api/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/api/auth/login?error=oauth_error',
      session: true
    }),
    controller.googleCallback
  );

  app.get(
    '/api/auth/github',
    passport.authenticate('github', { 
      scope: ['user:email', 'read:user'],
      session: true
    })
  );

  app.get(
    '/api/auth/github/callback', 
    passport.authenticate('github', { 
      failureRedirect: '/api/auth/login?error=oauth_error',
      session: true
    }),
    controller.githubCallback
  );

  // Session check endpoint
  app.get('/api/auth/session', (req, res) => {
    if (req.session && req.session.userId) {
      res.json({
        id: req.session.userId,
        username: req.session.username,
        roles: req.session.roles
      });
    } else {
      res.status(401).json({ message: 'No active session' });
    }
  });
};
