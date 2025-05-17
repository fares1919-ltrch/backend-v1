const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      username: { type: String, required: true },
      email: { type: String, required: true },
      password: {
        type: String,
        required: function () {
          return this.provider === "local" || !this.provider;
        },
      },
      emailVerified: {
        type: Boolean,
        default: false,
      },
      verificationToken: String,
      verificationTokenExpires: Date,
      resetPasswordToken: String,
      resetPasswordExpires: Date,
      resetPasswordRawToken: String,
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
      address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
        country: { type: String },
        lat: { type: Number },
        lon: { type: Number },
      },
      aboutMe: String,
      work: String,
      workplace: String,
      photo: String,
      birthDate: Date,
      identityNumber: {
        type: Number,
        unique: true,
        sparse: true,
      },
      // Biometric data reference
      biometric: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Biometric",
      },
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
