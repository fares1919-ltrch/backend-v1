const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const cpfRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    identityNumber: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in hours
      required: true,
    },
    cost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    officerDecision: {
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
      },
      comment: String,
      decidedAt: Date,
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },
    appointmentDate: Date,
  },
  {
    timestamps: true
  }
);

cpfRequestSchema.plugin(mongoosePaginate);

const CpfRequest = mongoose.model("CpfRequest", cpfRequestSchema);

module.exports = CpfRequest;
