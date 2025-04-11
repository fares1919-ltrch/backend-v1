const mongoose = require("mongoose");

const Appointment = mongoose.model(
  "Appointment",
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      officerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      cpfRequestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CpfRequest",
        required: true,
      },
      appointmentDate: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ["scheduled", "completed", "cancelled", "missed"],
        default: "scheduled",
      },
      notes: String,
      location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Center",
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    },
    {
      timestamps: true,
    }
  )
);

module.exports = Appointment;
