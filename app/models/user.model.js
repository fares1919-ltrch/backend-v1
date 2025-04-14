const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      firstanme: String,
      lastname: String,
      email: String,
      password: String,
      resetPasswordToken: String,
      resetPasswordExpires: Date,
      provider: {
        type: String,
        enum: ["local", "google", "github"],
        default: "local",
      },
      googleId: {
        type: String,
        sparse: true,
      },
      githubId: {
        type: String,
        sparse: true,
      },
      // Profile fields
      firstName: String,
      lastName: String,
      address: String,
      city: String,
      country: String,
      postalCode: String,
      aboutMe: String,
      work: String,
      workplace: String,
      photo: String,
      // Session management
      activeSessions: [
        {
          token: String,
          device: String,
          lastActive: Date,
          ipAddress: String,
        },
      ],
      roles: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Role",
        },
      ],
    },
    {
      timestamps: true,
    }
  )
);

module.exports = User;
