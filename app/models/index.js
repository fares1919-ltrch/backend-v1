const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require("./user.model");
db.role = require("./role.model");
db.refreshToken = require("./refreshToken.model");
db.cpfRequest = require("./cpfRequest.model");
db.cpfCredential = require("./cpfCredential.model");
db.appointment = require("./appointment.model");
db.biometricData = require("./biometricData.model");
db.notification = require("./notification.model");
db.center = require("./center.model");

db.ROLES = ["user", "admin", "officer", "manager"];

module.exports = db;
