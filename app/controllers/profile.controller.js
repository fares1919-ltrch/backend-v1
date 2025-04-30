const db = require("../models");
const User = db.user;
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const path = require("path");

/************************************************
 * PROFILE RETRIEVAL AND MANAGEMENT
 ************************************************/
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
      "aboutMe",
      "work",
      "workplace",
      "birthDate",
      "identityNumber",
    ];

    const updates = Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    // Validate address structure if present
    if (updates.address) {
      const requiredFields = [
        "street",
        "city",
        "state",
        "postalCode",
        "country",
        "lat",
        "lon",
      ];
      for (const field of requiredFields) {
        if (
          !updates.address.hasOwnProperty(field) ||
          updates.address[field] === undefined ||
          updates.address[field] === ""
        ) {
          return res.status(400).json({
            message: `Missing address field: ${field}`,
          });
        }
      }
    }

    // Handle photo upload if present
    if (req.file) {
      updates.photo = `/uploads/profile/${req.file.filename}`;
    }

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

/************************************************
 * ACCOUNT LINKING AND SESSIONS
 ************************************************/
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

/************************************************
 * LOCATION MANAGEMENT AND CPF VALIDATION
 ************************************************/
// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const { address, coordinates } = req.body;

    if (!coordinates || !coordinates.lat || !coordinates.lon) {
      return res
        .status(400)
        .json({ message: "Valid coordinates are required" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          location: {
            lat: coordinates.lat,
            lon: coordinates.lon,
          },
          address: address || "",
        },
      },
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

// Validate profile completeness for CPF request
exports.validateProfileForCpf = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Define required fields for CPF request
    const requiredFields = [
      "firstName",
      "lastName",
      "birthDate",
      "identityNumber",
    ];

    // Check which fields are missing
    const missingFields = requiredFields.filter((field) => {
      return !user[field];
    });

    // Check if location is missing, but track it separately
    const locationMissing =
      !user.location || !user.location.lat || !user.location.lon;

    // We'll use this for the complete check
    // If the user is on the CPF request page, we don't consider location as a blocking issue
    // since they can select it directly on the map
    const isComplete = missingFields.length === 0;

    // Don't include location in the missing fields message
    // We'll handle it separately with the locationNeeded flag
    const messageFields = [...missingFields];
    const locationNeeded = locationMissing;

    res.status(200).json({
      isComplete,
      missingFields: messageFields,
      locationNeeded: locationNeeded,
      message: isComplete
        ? "Profile is complete for CPF request"
        : locationNeeded && messageFields.length === 0
        ? "Please select your location on the map"
        : `Profile is incomplete. Missing fields: ${messageFields.join(", ")}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if identity number is unique
exports.checkIdentityNumberUnique = async (req, res) => {
  try {
    const { identityNumber } = req.params;

    if (!identityNumber) {
      return res.status(400).json({ message: "Identity number is required" });
    }

    // Check if this identity number exists with any user except current user
    const existingUser = await User.findOne({
      identityNumber: identityNumber,
      _id: { $ne: req.userId },
    });

    // If user found, the identity number is not unique
    const isUnique = !existingUser;

    res.status(200).json(isUnique);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
