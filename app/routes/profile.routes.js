const { authJwt } = require("../middlewares");
const controller = require("../controllers/profile.controller");
const upload = require("../middlewares/upload");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // Profile routes (all require authentication)
  app.get("/api/profile", [authJwt.verifyToken], controller.getProfile);

  app.put(
    "/api/profile",
    [authJwt.verifyToken, upload.single("photo")],
    controller.updateProfile
  );

  app.delete("/api/profile", [authJwt.verifyToken], controller.deleteAccount);

  // OAuth account linking
  app.post(
    "/api/profile/link-oauth",
    [authJwt.verifyToken],
    controller.linkOAuthAccount
  );

  // Session management
  app.get(
    "/api/profile/sessions",
    [authJwt.verifyToken],
    controller.getActiveSessions
  );

  app.delete(
    "/api/profile/sessions/:sessionToken",
    [authJwt.verifyToken],
    controller.revokeSession
  );
};
