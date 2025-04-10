const db = require("../models");
const BiometricData = db.biometricData;
const Appointment = db.appointment;
const User = db.user;
const BiometricProcessor = require("../utils/biometricProcessor");
const config = require("../config/biometric.config");
const fs = require('fs').promises;

// Submit biometric data
exports.submit = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;

    // Verify appointment exists and is scheduled
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      status: "scheduled"
    });

    if (!appointment) {
      return res.status(404).send({
        message: "No valid appointment found"
      });
    }

    // Check if officer is assigned to this appointment
    if (appointment.officerId.toString() !== req.userId) {
      return res.status(403).send({
        message: "Not authorized to submit biometric data for this appointment"
      });
    }

    // Process and validate fingerprints
    const fingerprints = [];
    for (const finger of Object.keys(req.biometricFiles).filter(k => k.startsWith('fingerprint_'))) {
      const file = req.biometricFiles[finger][0];
      const imageData = await fs.readFile(file.path);
      const processed = await BiometricProcessor.processFingerprintImage(imageData, 'WSQ');
      
      fingerprints.push({
        finger: finger.replace('fingerprint_', ''),
        data: processed.data,
        format: processed.format,
        quality: processed.quality,
        dpi: processed.dpi
      });
    }

    // Validate minimum fingerprint requirement
    if (fingerprints.length < config.validation.minFingerprintCount) {
      return res.status(400).send({
        message: `At least ${config.validation.minFingerprintCount} fingerprints are required`
      });
    }

    // Process face photo
    let face;
    if (req.biometricFiles.face) {
      const faceFile = req.biometricFiles.face[0];
      const imageData = await fs.readFile(faceFile.path);
      face = await BiometricProcessor.processFacialImage(imageData);
    } else {
      return res.status(400).send({
        message: "Face photo is required"
      });
    }

    // Process iris scans if provided
    let iris = {};
    if (req.biometricFiles.iris_right) {
      const irisData = await fs.readFile(req.biometricFiles.iris_right[0].path);
      iris.right = await BiometricProcessor.processIrisImage(irisData);
    }
    if (req.biometricFiles.iris_left) {
      const irisData = await fs.readFile(req.biometricFiles.iris_left[0].path);
      iris.left = await BiometricProcessor.processIrisImage(irisData);
    }

    // Process supporting documents
    const supportingDocuments = [];
    if (req.biometricFiles.document) {
      for (const docFile of req.biometricFiles.document) {
        const docData = await fs.readFile(docFile.path);
        const processed = await BiometricProcessor.processSupportingDocument(
          docData,
          docFile.mimetype === 'application/pdf' ? 'PDF' : 'JPEG'
        );
        
        supportingDocuments.push({
          type: req.body[`document_type_${supportingDocuments.length}`] || 'other',
          documentNumber: req.body[`document_number_${supportingDocuments.length}`],
          issuingAuthority: req.body[`document_authority_${supportingDocuments.length}`],
          data: processed.data,
          format: processed.format
        });
      }
    }

    // Create biometric data record
    const biometricData = new BiometricData({
      userId,
      appointmentId,
      officerId: req.userId,
      fingerprints,
      face,
      iris,
      supportingDocuments,
      collectionMetadata: {
        deviceInfo: {
          fingerprintScanner: req.body.fingerprintScanner || 'Standard USB Scanner',
          camera: req.body.camera || 'Standard Webcam',
          irisScanner: req.body.irisScanner
        },
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(req.body.longitude) || 0,
            parseFloat(req.body.latitude) || 0
          ]
        },
        collectionCenter: req.body.collectionCenter,
        environmentConditions: {
          lighting: req.body.lighting || 'adequate',
          temperature: parseFloat(req.body.temperature) || 22,
          humidity: parseFloat(req.body.humidity) || 50
        }
      }
    });

    const savedBiometricData = await biometricData.save();

    // Update appointment status
    appointment.status = "completed";
    await appointment.save();

    res.status(201).send(savedBiometricData);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get user's biometric data
exports.getUserBiometricData = async (req, res) => {
  try {
    const biometricData = await BiometricData.findOne({
      userId: req.params.userId
    }).populate("appointmentId");

    if (!biometricData) {
      return res.status(404).send({ message: "No biometric data found" });
    }

    // Check authorization
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map(role => role.name);
    
    if (!roles.includes('officer') && biometricData.officerId.toString() !== req.userId) {
      return res.status(403).send({
        message: "Not authorized to view this biometric data"
      });
    }

    res.send(biometricData);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Verify biometric data quality
exports.verifyQuality = async (req, res) => {
  try {
    const biometricData = await BiometricData.findById(req.params.id);
    
    if (!biometricData) {
      return res.status(404).send({ message: "Biometric data not found" });
    }

    // Only officers can verify quality
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map(role => role.name);
    
    if (!roles.includes('officer')) {
      return res.status(403).send({ message: "Not authorized to verify biometric data" });
    }

    // Check quality thresholds
    const qualityCheck = {
      fingerprints: biometricData.fingerprints.every(f => f.quality >= 60),
      face: biometricData.face.quality >= 70,
      iris: (!biometricData.iris.right || biometricData.iris.right.quality >= 60) &&
            (!biometricData.iris.left || biometricData.iris.left.quality >= 60)
    };

    const overallQuality = Object.values(qualityCheck).every(q => q);

    // Update verification status
    biometricData.verificationStatus = overallQuality ? "verified" : "requires_review";
    biometricData.verificationDetails = {
      verifiedBy: req.userId,
      verifiedAt: new Date(),
      failureReason: !overallQuality ? "Quality standards not met" : null,
      attempts: [
        ...biometricData.verificationDetails?.attempts || [],
        {
          timestamp: new Date(),
          status: overallQuality ? "success" : "failed",
          reason: !overallQuality ? "Quality standards not met" : null
        }
      ]
    };

    await biometricData.save();

    res.send({
      status: biometricData.verificationStatus,
      qualityCheck,
      verificationDetails: biometricData.verificationDetails
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get collection center statistics
exports.getCollectionStats = async (req, res) => {
  try {
    // Only officers can view stats
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map(role => role.name);
    
    if (!roles.includes('officer')) {
      return res.status(403).send({ message: "Not authorized to view statistics" });
    }

    const stats = await BiometricData.aggregate([
      {
        $group: {
          _id: "$collectionMetadata.collectionCenter",
          totalCollections: { $sum: 1 },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ["$verificationStatus", "verified"] }, 1, 0] }
          },
          averageQuality: {
            $avg: { $avg: "$fingerprints.quality" }
          }
        }
      }
    ]);

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
