const { authJwt } = require("../middlewares");
const { uploadBiometrics, cleanupBiometricFiles } = require("../middlewares/uploadBiometrics");
const controller = require("../controllers/biometricData.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  // Submit biometric data (officer only)
  app.post(
    "/api/biometric-data",
    [
      authJwt.verifyToken,
      authJwt.isOfficer,
      uploadBiometrics,
      cleanupBiometricFiles
    ],
    controller.submit
  );

  // Get user's biometric data (officer only)
  app.get(
    "/api/biometric-data/:userId",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getUserBiometricData
  );

  // Verify biometric data quality (officer only)
  app.post(
    "/api/biometric-data/:id/verify",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.verifyQuality
  );

  // Get collection center statistics (officer only)
  app.get(
    "/api/biometric-data/stats/collection-centers",
    [
      authJwt.verifyToken,
      authJwt.isOfficer
    ],
    controller.getCollectionStats
  );
};
