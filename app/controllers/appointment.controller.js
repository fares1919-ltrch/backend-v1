const db = require("../models");
const Appointment = db.appointment;
const User = db.user;
const CpfRequest = db.cpfRequest;

// Create new appointment
exports.create = async (req, res) => {
  try {
    const { userId, appointmentDate, notes, location } = req.body;

    // Verify CPF request exists and is awaiting appointment
    const cpfRequest = await CpfRequest.findOne({
      userId,
      status: "awaiting_appointment"
    });

    if (!cpfRequest) {
      return res.status(404).send({
        message: "No CPF request awaiting appointment found for this user"
      });
    }

    const appointment = new Appointment({
      userId,
      officerId: req.userId,
      cpfRequestId: cpfRequest._id,
      appointmentDate,
      notes,
      location
    });

    const savedAppointment = await appointment.save();

    // Update CPF request status and link appointment
    cpfRequest.status = "processing";
    cpfRequest.currentAppointment = savedAppointment._id;
    await cpfRequest.save();

    // TODO: Send notification to user about appointment

    res.status(201).send(savedAppointment);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get officer's appointments
exports.getOfficerAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ officerId: req.userId })
      .populate("userId", "username email firstName lastName")
      .populate("cpfRequestId")
      .sort({ appointmentDate: 1 });

    res.send(appointments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get user's appointment
exports.getUserAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ userId: req.params.userId })
      .populate("officerId", "username email firstName lastName")
      .populate("cpfRequestId");

    if (!appointment) {
      return res.status(404).send({ message: "No appointment found" });
    }

    res.send(appointment);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update appointment status
exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    if (appointment.officerId.toString() !== req.userId) {
      return res.status(403).send({
        message: "Not authorized to update this appointment"
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;

    const updatedAppointment = await appointment.save();

    // If appointment is completed, update CPF request status
    if (status === "completed") {
      const cpfRequest = await CpfRequest.findById(appointment.cpfRequestId);
      if (cpfRequest) {
        cpfRequest.status = "completed";
        await cpfRequest.save();
      }
    }

    res.send(updatedAppointment);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
