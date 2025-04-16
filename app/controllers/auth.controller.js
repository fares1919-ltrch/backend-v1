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
      identityNumber: req.body.identityNumber,
      birthDate: req.body.birthDate,
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
      expiresIn: "24h", // Match cookie duration
    });

    // Generate refresh token with longer expiration
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

    // Set secure cookie with refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

// Google OAuth Callback
exports.googleCallback = async (req, res) => {
  try {
    // The user object is already populated by passport
    const user = req.user;
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: "24h", // Match cookie duration
      algorithm: "HS256",
    });

    // Ensure user has the correct roles and populate them
    if (!user.roles || user.roles.length === 0) {
      const userRole = await Role.findOne({ name: "user" });
      if (!userRole) {
        throw new Error("Default user role not found");
      }
      user.roles = [userRole._id];
      await user.save();
    }

    // Populate roles for the user
    await user.populate("roles");

    // Set session data with populated roles
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = user.roles.map((role) => `ROLE_${role.name.toUpperCase()}`);
    req.session.lastActive = new Date();

    // Set secure cookie
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

    // Generate refresh token with longer expiration
    let refreshToken = await RefreshToken.createToken(user);

    // Set secure cookie with refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to appropriate dashboard based on roles
    const frontendUrl = process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "http://localhost:4200";

    const roles = req.session.roles;
    if (roles.includes("ROLE_USER")) {
      return res.redirect(`${frontendUrl}/dashboard/citizen?token=${token}`);
    } else if (roles.includes("ROLE_MANAGER")) {
      return res.redirect(`${frontendUrl}/dashboard/manager?token=${token}`);
    } else if (roles.includes("ROLE_OFFICER")) {
      return res.redirect(`${frontendUrl}/dashboard/officer?token=${token}`);
    }

    // Default to citizen dashboard if role is not recognized
    return res.redirect(`${frontendUrl}/dashboard/citizen?token=${token}`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const loginErrorUrl = process.env.NODE_ENV === "production"
      ? `${process.env.FRONTEND_URL}/auth/login?error=oauth_error`
      : "http://localhost:4200/auth/login?error=oauth_error";

    return res.redirect(loginErrorUrl);
  }
};

// GitHub OAuth Callback
exports.githubCallback = async (req, res) => {
  try {
    // The user object is already populated by passport
    const user = req.user;
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: "24h", // Match cookie duration
      algorithm: "HS256",
    });

    // Ensure user has the correct roles and populate them
    if (!user.roles || user.roles.length === 0) {
      const userRole = await Role.findOne({ name: "user" });
      if (!userRole) {
        throw new Error("Default user role not found");
      }
      user.roles = [userRole._id];
      await user.save();
    }

    // Populate roles for the user
    await user.populate("roles");

    // Set session data with populated roles
    req.session.token = token;
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.roles = user.roles.map((role) => `ROLE_${role.name.toUpperCase()}`);
    req.session.lastActive = new Date();

    // Set secure cookie
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

    // Generate refresh token with longer expiration
    let refreshToken = await RefreshToken.createToken(user);

    // Set secure cookie with refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to appropriate dashboard based on roles
    const frontendUrl = process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : "http://localhost:4200";

    const roles = req.session.roles;
    if (roles.includes("ROLE_USER")) {
      return res.redirect(`${frontendUrl}/dashboard/citizen?token=${token}`);
    } else if (roles.includes("ROLE_MANAGER")) {
      return res.redirect(`${frontendUrl}/dashboard/manager?token=${token}`);
    } else if (roles.includes("ROLE_OFFICER")) {
      return res.redirect(`${frontendUrl}/dashboard/officer?token=${token}`);
    }

    // Default to citizen dashboard if role is not recognized
    return res.redirect(`${frontendUrl}/dashboard/citizen?token=${token}`);
  } catch (err) {
    console.error("GitHub OAuth callback error:", err);
    const loginErrorUrl = process.env.NODE_ENV === "production"
      ? `${process.env.FRONTEND_URL}/auth/login?error=oauth_error`
      : "http://localhost:4200/auth/login?error=oauth_error";

    return res.redirect(loginErrorUrl);
  }
};
