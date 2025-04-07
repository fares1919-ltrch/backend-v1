const db = require("../models");
const User = db.user;
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("roles", "-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      "firstName",
      "lastName",
      "address",
      "city",
      "country",
      "postalCode",
      "aboutMe",
      "work",
      "workplace",
      "photo",
    ];

    const updates = Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear all sessions
    user.activeSessions = [];
    await user.save();

    // Delete the user
    await User.findByIdAndDelete(req.userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Link OAuth account
exports.linkOAuthAccount = async (req, res) => {
  try {
    const { provider, providerId } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the provider ID is already linked to another account
    const existingUser = await User.findOne({
      [`${provider}Id`]: providerId,
    });

    if (existingUser && existingUser._id.toString() !== req.userId) {
      return res.status(400).json({
        message: `This ${provider} account is already linked to another user`,
      });
    }

    // Update the user's provider ID
    user[`${provider}Id`] = providerId;
    await user.save();

    res
      .status(200)
      .json({ message: `${provider} account linked successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get active sessions
exports.getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("activeSessions");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.activeSessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Revoke session
exports.revokeSession = async (req, res) => {
  try {
    const { sessionToken } = req.params;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.activeSessions = user.activeSessions.filter(
      (session) => session.token !== sessionToken
    );

    await user.save();

    res.status(200).json({ message: "Session revoked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
