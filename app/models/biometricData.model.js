const mongoose = require("mongoose");

const BiometricData = mongoose.model(
  "BiometricData",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
      },
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
        index: true
      },
      officerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      fingerprints: [{
        finger: {
          type: String,
          enum: [
            "right_thumb", "right_index", "right_middle", "right_ring", "right_little",
            "left_thumb", "left_index", "left_middle", "left_ring", "left_little"
          ],
          required: true
        },
        data: {
          type: String,  // Base64 encoded fingerprint data
          required: true
        },
        format: {
          type: String,
          enum: ["WSQ", "JPEG2000", "PNG"],
          required: true
        },
        quality: {
          type: Number,  // Quality score 0-100
          required: true
        },
        dpi: {
          type: Number,
          required: true
        },
        capturedAt: {
          type: Date,
          default: Date.now
        }
      }],
      face: {
        data: String,  // Base64 encoded photo
        format: {
          type: String,
          enum: ["JPEG", "PNG"],
          required: true
        },
        quality: {
          type: Number,  // Quality score 0-100
          required: true
        },
        attributes: {
          width: Number,
          height: Number,
          hasNeutralExpression: Boolean,
          hasUniformBackground: Boolean,
          hasProperLighting: Boolean
        },
        capturedAt: {
          type: Date,
          default: Date.now
        }
      },
      iris: {
        right: {
          data: String,  // Base64 encoded iris data
          quality: Number,
          format: {
            type: String,
            enum: ["ISO-19794-6", "JPEG2000"],
          },
          capturedAt: Date
        },
        left: {
          data: String,  // Base64 encoded iris data
          quality: Number,
          format: {
            type: String,
            enum: ["ISO-19794-6", "JPEG2000"],
          },
          capturedAt: Date
        }
      },
      supportingDocuments: [{
        type: {
          type: String,
          enum: ["identity_card", "passport", "birth_certificate", "other"],
          required: true
        },
        documentNumber: String,
        issuingAuthority: String,
        data: String,  // Base64 encoded document scan
        format: {
          type: String,
          enum: ["PDF", "JPEG", "PNG"],
          required: true
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }],
      verificationStatus: {
        type: String,
        enum: ["pending", "verified", "failed", "requires_review"],
        default: "pending",
        index: true
      },
      verificationDetails: {
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        verifiedAt: Date,
        failureReason: String,
        attempts: [{
          timestamp: Date,
          status: String,
          reason: String
        }]
      },
      collectionMetadata: {
        deviceInfo: {
          fingerprintScanner: String,
          camera: String,
          irisScanner: String
        },
        location: {
          type: {
            type: String,
            default: "Point"
          },
          coordinates: [Number]  // [longitude, latitude]
        },
        collectionCenter: String,
        environmentConditions: {
          lighting: String,
          temperature: Number,
          humidity: Number
        }
      },
      collectedAt: {
        type: Date,
        default: Date.now
      }
    },
    {
      timestamps: true,
      indexes: [
        { userId: 1 },
        { appointmentId: 1 },
        { verificationStatus: 1 },
        { "collectionMetadata.location": "2dsphere" }
      ]
    }
  )
);

module.exports = BiometricData;
