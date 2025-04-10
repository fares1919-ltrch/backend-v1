const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;
const RefreshToken = db.refreshToken;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    // Save User to Database
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      provider: "local",
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      postalCode: req.body.postalCode,
      aboutMe: req.body.aboutMe,
      work: req.body.work,
      workplace: req.body.workplace,
      photo: req.body.photo,
    });

    // Handle role assignment
    if (req.body.roles && req.body.roles.length > 0) {
      // Find roles specified in the request
      const roles = await Role.find({
        name: { $in: req.body.roles },
      });

      // Check if all requested roles were found
      if (roles.length !== req.body.roles.length) {
        return res.status(400).json({
          message: "One or more roles specified do not exist!",
          validRoles: ["user", "manager", "officer"],
          providedRoles: req.body.roles,
        });
      }

      // Assign the found roles to the user
      user.roles = roles.map((role) => role._id);
    } else {
      // Assign default 'user' role if no roles specified
      const defaultRole = await Role.findOne({ name: "user" });
      if (!defaultRole) {
        return res.status(500).json({
          message: "Default role 'user' not found in the database!",
        });
      }
      user.roles = [defaultRole._id];
    }

    // Save the user with roles
    const savedUser = await user.save();

    // Populate roles for response
    await savedUser.populate("roles", "-__v");

    res.status(200).json({
      message: "User was registered successfully!",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        roles: savedUser.roles.map((role) => role.name),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "An error occurred during signup" });
  }
};

exports.signin = async (req, res) => {
  try {
    // Find user and populate roles
    const user = await User.findOne({ username: req.body.username }).populate(
      "roles",
      "-__v"
    );

    if (!user) {
      return res.status(404).json({ message: "User Not found." });
    }

    // Validate password
    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, config.jwtSecret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: config.jwtExpiration, // 1 hour
    });

    // Generate refresh token
    let refreshToken = await RefreshToken.createToken(user);

    // Generate authorities from roles
    const authorities = user.roles.map(
      (role) => `ROLE_${role.name.toUpperCase()}`
    );

    // Add session to user's active sessions
    const session = {
      token: token,
      device: req.headers["user-agent"] || "Unknown",
      lastActive: new Date(),
      ipAddress: req.ip,
    };

    user.activeSessions.push(session);
    await user.save();

    // Set session data with enhanced security
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = authorities;
    req.session.lastActive = new Date();

    // Set secure cookie with token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.DOMAIN
          : "localhost",
    });

    // Send response
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      roles: authorities,
      accessToken: token,
      refreshToken: refreshToken,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "An error occurred during signin" });
  }
};

exports.signout = async (req, res) => {
  try {
    const token = req.headers["x-access-token"] || req.session.token;

    if (token) {
      // Remove the session from user's active sessions
      const user = await User.findById(req.userId);
      if (user) {
        user.activeSessions = user.activeSessions.filter(
          (session) => session.token !== token
        );
        await user.save();
      }
    }

    req.session = null;
    return res.status(200).json({
      message: "You've been signed out successfully.",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "An error occurred during signout" });
  }
};
