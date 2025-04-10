const db = require("../models");
const CpfCredential = db.cpfCredential;
const CpfRequest = db.cpfRequest;
const User = db.user;
const { generateCpf } = require("../utils/cpfGenerator");

// Issue new CPF credential
exports.issue = async (req, res) => {
  try {
    const { userId, cpfRequestId, validUntil } = req.body;

    // Check if user already has an active credential
    const existingCredential = await CpfCredential.findOne({
      userId,
      status: "active"
    });

    if (existingCredential) {
      return res.status(400).send({
        message: "User already has an active CPF credential"
      });
    }

    // Verify CPF request is approved
    const cpfRequest = await CpfRequest.findOne({
      _id: cpfRequestId,
      status: "approved"
    }).populate("userId", "firstName lastName");

    if (!cpfRequest) {
      return res.status(404).send({
        message: "No approved CPF request found"
      });
    }

    // Validate validUntil date
    const validUntilDate = new Date(validUntil);
    if (isNaN(validUntilDate.getTime())) {
      return res.status(400).send({
        message: "Invalid validUntil date format. Please use YYYY-MM-DD format"
      });
    }

    if (validUntilDate <= new Date()) {
      return res.status(400).send({
        message: "validUntil date must be in the future"
      });
    }

    // Generate CPF number using user's identity information
    const cpfNumber = generateCpf(
      `${cpfRequest.userId.firstName} ${cpfRequest.userId.lastName}`,
      cpfRequest.birthDate,
      cpfRequest.identityNumber
    );

    // Create new CPF credential
    const credential = new CpfCredential({
      userId,
      cpfRequestId,
      credentialNumber: cpfNumber,
      issuedBy: req.userId, // Current officer
      validUntil: validUntilDate,
      status: "active"
    });

    const savedCredential = await credential.save();

    // Update CPF request status to indicate credential was issued
    cpfRequest.status = "completed";
    await cpfRequest.save();

    res.status(201).send(savedCredential);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get user's CPF credential
exports.getUserCredential = async (req, res) => {
  try {
    const credential = await CpfCredential.findOne({ userId: req.userId })
      .populate("cpfRequestId")
      .populate("issuedBy", "username firstName lastName")
      .sort({ createdAt: -1 });

    if (!credential) {
      return res.status(404).send({ message: "No CPF credential found" });
    }

    res.send(credential);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Verify CPF credential
exports.verifyCredential = async (req, res) => {
  try {
    const { credentialNumber } = req.params;
    const credential = await CpfCredential.findOne({ credentialNumber })
      .populate("userId", "firstName lastName")
      .populate("issuedBy", "firstName lastName")
      .populate("cpfRequestId", "identityNumber birthDate");

    if (!credential) {
      return res.status(404).send({ message: "CPF credential not found" });
    }

    // Check if credential is still valid
    if (credential.status !== "active" || credential.validUntil < new Date()) {
      return res.status(400).send({
        message: "CPF credential is no longer valid",
        status: credential.status,
        validUntil: credential.validUntil
      });
    }

    // Verify CPF number authenticity
    const expectedCpfNumber = generateCpf(
      `${credential.userId.firstName} ${credential.userId.lastName}`,
      credential.cpfRequestId.birthDate,
      credential.cpfRequestId.identityNumber
    );

    if (expectedCpfNumber !== credential.credentialNumber) {
      return res.status(400).send({
        message: "CPF credential has been tampered with"
      });
    }

    res.send({
      message: "CPF credential is valid",
      credential
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
