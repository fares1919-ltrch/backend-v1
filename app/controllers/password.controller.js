const crypto = require("crypto");
const nodemailer = require("nodemailer");
const config = require("../config/email.config");
const db = require("../models");
const User = db.user;
const bcrypt = require("bcryptjs");

// Create transporter for sending emails
const transporter = nodemailer.createTransport(config);

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: config.auth.user,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>You requested a password reset</h1>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).send({ message: "Password reset email sent!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid or expired reset token!" });
    }

    // Set new password
    user.password = bcrypt.hashSync(password, 8);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send({ message: "Password has been reset!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId; // From auth middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Verify current password
    const isValidPassword = bcrypt.compareSync(currentPassword, user.password);
    if (!isValidPassword) {
      return res
        .status(400)
        .send({ message: "Current password is incorrect!" });
    }

    // Set new password
    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();

    res.status(200).send({ message: "Password has been changed!" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
