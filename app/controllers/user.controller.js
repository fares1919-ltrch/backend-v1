const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");

/************************************************
 * ROLE-BASED ACCESS CONTROL
 * Content access methods for different roles
 ************************************************/
exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.managerBoard = (req, res) => {
  res.status(200).send("Manager Content.");
};

exports.officerBoard = (req, res) => {
  res.status(200).send("Officer Content.");
};

/************************************************
 * USER MANAGEMENT (ADMIN FUNCTIONS)
 * Methods for getting and managing all users
 ************************************************/
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.role) {
      query.roles = { $in: [req.query.role] };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users,
      currentPage: page,
      totalPages,
      totalUsers: total,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.status = status;
    if (reason) {
      user.statusReason = reason;
    }
    await user.save();

    res.send({ message: "User status updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { roles } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    user.roles = roles;
    await user.save();

    res.send({ message: "User roles updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * USER PROFILE MANAGEMENT
 * Methods for users to manage their own profile
 ************************************************/
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (email) {
      const emailExists = await User.findOne({
        email,
        _id: { $ne: req.userId },
      });

      if (emailExists) {
        return res.status(400).send({
          message: "Email is already in use",
        });
      }
      user.email = email;
    }

    if (currentPassword && newPassword) {
      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return res.status(400).send({
          message: "Current password is incorrect",
        });
      }

      user.password = await bcrypt.hash(newPassword, 8);
    }

    await user.save();
    res.send({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * VERIFICATION UTILITIES
 * Helper methods for verification processes
 ************************************************/
exports.checkIdentityNumber = async (req, res) => {
  try {
    const user = await User.findOne({
      identityNumber: req.params.identityNumber,
    });
    res.json({ isAvailable: !user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
