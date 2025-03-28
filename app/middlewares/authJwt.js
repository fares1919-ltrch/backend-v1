const jwt = require("jsonwebtoken");
const { TokenExpiredError } = jwt;
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const Role = db.role;

const catchError = (err, res) => {
  if (err instanceof TokenExpiredError) {
    return res
      .status(401)
      .send({ message: "Unauthorized! Access Token was expired!" });
  }
  return res.status(401).send({ message: "Unauthorized!" });
};

const verifyToken = (req, res, next) => {
  const token = req.session.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  try {
    const decoded = jwt.verify(token, config.secret);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return catchError(err, res);
  }
};

const isManager = async (req, res, next) => {
  try {
    // Find the user and populate their roles
    const user = await User.findById(req.userId).populate("roles");

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Check if user has manager role using some()
    const isManagerRole = user.roles.some((role) => role.name === "manager");

    if (isManagerRole) {
      return next();
    }

    res.status(403).send({
      message: "Require Manager Role!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred checking manager role",
    });
  }
};

const isOfficer = async (req, res, next) => {
  try {
    // Find the user and populate their roles
    const user = await User.findById(req.userId).populate("roles");

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Check if user has officer role using some()
    const isOfficerRole = user.roles.some((role) => role.name === "officer");

    if (isOfficerRole) {
      return next();
    }

    res.status(403).send({
      message: "Require Officer Role!",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message || "An error occurred checking officer role",
    });
  }
};

const authJwt = {
  verifyToken,
  isManager,
  isOfficer,
};

module.exports = authJwt;
