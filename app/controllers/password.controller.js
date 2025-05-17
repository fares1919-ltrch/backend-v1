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
      return res.status(404).json({ message: "User not found!" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token for storage in the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    user.resetPasswordRawToken = resetToken; // Store unhashed token for code verification

    await user.save();

    // Create a deterministic seed based on user email and reset token hash
    // This ensures the code is tied to both the user and the specific reset request
    const seed = user.email + user.resetPasswordToken.substring(0, 16);
    const seedHash = crypto.createHash("sha256").update(seed).digest("hex");

    // Generate a 6-digit code from the seed hash
    const verificationCode = parseInt(seedHash.substring(0, 8), 16) % 1000000;
    const formattedVerificationCode = verificationCode
      .toString()
      .padStart(6, "0");

    // Create reset URL - Updated to use frontend URL
    const clientUrl = process.env.CLIENT_URL || "http://localhost:4200";
    const resetUrl = `${clientUrl}/auth/reset-password/${resetToken}`;

    // Email content with both link and verification code
    const mailOptions = {
      from: config.auth.user,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <h1>You requested a password reset</h1>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>Or use this verification code: <strong>${formattedVerificationCode}</strong></p>
        <p>This link and code will expire in 1 hour.</p>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset email sent!" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Get token from request params or body
    const token = req.params.token || req.body.token;
    const { password } = req.body;

    console.log("Received reset request with token:", token);
    console.log("Token type:", typeof token);
    console.log("Token length:", token ? token.length : 0);

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required!" });
    }

    // Always hash the token from the URL/email link
    // This is because we store the hashed version in the database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    console.log("Hashed token for database lookup:", hashedToken);

    // Look for a user with this hashed token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    // If no user found, the token is invalid or expired
    if (!user) {
      console.log("No user found with the provided token");
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token!" });
    }

    console.log("User found, resetting password");

    // Set new password
    user.password = bcrypt.hashSync(password, 8);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordRawToken = undefined; // Clear unhashed token for security

    await user.save();

    console.log("Password reset successful");
    res.status(200).json({ message: "Password has been reset!" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required!" });
    }

    // Find user by email
    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user || !user.resetPasswordToken || !user.resetPasswordRawToken) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset request!" });
    }

    // Create a deterministic seed based on user email and reset token
    const seed = user.email + user.resetPasswordToken.substring(0, 16);
    const seedHash = crypto.createHash("sha256").update(seed).digest("hex");

    // Generate a 6-digit code from the seed hash
    const expectedCode = parseInt(seedHash.substring(0, 8), 16) % 1000000;
    const formattedExpectedCode = expectedCode.toString().padStart(6, "0");

    // Compare the provided code with our expected code
    if (code !== formattedExpectedCode) {
      return res.status(400).json({ message: "Invalid verification code!" });
    }

    // Return the unhashed token for the frontend to use in resetPassword
    res.status(200).json({
      message:
        "Verification successful! Use this token to reset your password.",
      email: user.email,
      token: user.resetPasswordRawToken, // Return unhashed token
    });
  } catch (err) {
    console.error("Verification code error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId; // From auth middleware

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Verify current password
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect!" });
    }

    // Update password
    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
