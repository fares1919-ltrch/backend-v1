const db = require("../models");
const Appointment = db.appointment;
const CpfRequest = db.cpfRequest;
const Center = db.center;
const User = db.user;

// Create new appointment
exports.create = async (req, res) => {
  try {
    const { userId, appointmentDate, notes, location } = req.body;

    // Check if user has officer role
    const user = await User.findById(req.userId).populate("roles");
    if (!user.roles.some(role => role.name === "officer")) {
      return res.status(403).send({
        message: "Not authorized. Only officers can create appointments"
      });
    }

    // Verify CPF request exists and is approved
    const cpfRequest = await CpfRequest.findOne({
      userId,
      $or: [
        { status: "approved" },
        { 'officerDecision.status': "approved" }
      ]
    });

    if (!cpfRequest) {
      return res.status(404).send({
        message: "No approved CPF request found for this user"
      });
    }

    // Check if appointment already exists
    if (cpfRequest.appointmentDate) {
      return res.status(400).send({
        message: "This CPF request already has an appointment scheduled"
      });
    }

    const appointment = new Appointment({
      userId,
      officerId: req.userId,
      cpfRequestId: cpfRequest._id,
      appointmentDate,
      notes,
      location: location // Use the center ID directly
    });

    const savedAppointment = await appointment.save();

    // Update CPF request status to completed since the appointment is created
    cpfRequest.status = "completed";
    cpfRequest.officerDecision.status = "approved"; // Keep as approved since it can't be completed
    cpfRequest.appointmentDate = appointmentDate;
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
    const appointment = await Appointment.findOne({ userId: req.userId })
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

// Get available time slots
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date, center } = req.query;

    // Validate required parameters
    if (!date || !center) {
      return res.status(400).send({
        message: "Date and center parameters are required"
      });
    }

    // Validate date format
    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).send({
        message: "Invalid date format. Please use YYYY-MM-DD"
      });
    }

    // Check if center exists
    const collectionCenter = await Center.findById(center);
    if (!collectionCenter) {
      return res.status(404).send({
        message: "Collection center not found"
      });
    }

    // Get center's working hours (assuming 9 AM to 5 PM with 30-minute slots)
    const startHour = 9;
    const endHour = 17;
    const slotDurationMinutes = 30;

    // Get existing appointments for the date
    const existingAppointments = await Appointment.find({
      appointmentDate: {
        $gte: new Date(date + "T00:00:00.000Z"),
        $lt: new Date(date + "T23:59:59.999Z")
      },
      location: center
    });

    // Generate all possible time slots
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDurationMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Check if slot is available
        const slotDateTime = new Date(date + "T" + timeString + ":00.000Z");
        const isAvailable = !existingAppointments.some(apt =>
          apt.appointmentDate.getTime() === slotDateTime.getTime()
        );

        slots.push({
          time: timeString,
          available: isAvailable
        });
      }
    }

    res.send({
      date: date,
      center: collectionCenter.code || center,
      slots: slots
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get center's daily appointments
exports.getCenterDailyAppointments = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { date } = req.query;

    // Get requested date or use today if not provided
    const requestedDate = date ? new Date(date) : new Date();

    // Get center details
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Get appointments for the day
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    startOfDay.setMinutes(0);
    startOfDay.setSeconds(0);
    startOfDay.setMilliseconds(0);

    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Adjust for timezone - ensure we're searching in UTC
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Requested date:', requestedDate.toISOString());
    console.log('Start of day:', startOfDay.toISOString());
    console.log('End of day:', endOfDay.toISOString());

    console.log('Looking for appointments with:', {
      location: centerId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Find appointments with detailed logging
    const appointments = await Appointment.find({
      location: centerId,
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate("userId", "firstName lastName");

    console.log('Found appointments:', appointments);
    console.log('Number of appointments found:', appointments.length);

    if (appointments.length === 0) {
      console.log('Checking all appointments for debugging:');
      const allAppointments = await Appointment.find({});
      console.log('All appointments:', allAppointments);
    }

    // Format response according to API spec
    res.send({
      date: date || new Date().toISOString().split('T')[0],
      center: {
        id: center._id,
        name: center.name
      },
      appointments: appointments.map(apt => ({
        id: apt._id,
        time: apt.appointmentDate.toTimeString().split(' ')[0].substring(0, 5),
        user: {
          id: apt.userId._id,
          name: `${apt.userId.firstName} ${apt.userId.lastName}`
        },
        status: apt.status
      }))
    });
  } catch (err) {
    console.error('Error getting daily appointments:', err);
    res.status(500).send({ message: err.message });
  }
};

// Update appointment status
exports.updateStatus = async (req, res) => {
  try {
    const { status, comments } = req.body;
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
    appointment.comments = comments;
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.userId;

    const updatedAppointment = await appointment.save();

    // If appointment is completed, update CPF request status
    if (status === "completed") {
      const cpfRequest = await CpfRequest.findById(appointment.cpfRequestId);
      if (cpfRequest) {
        // Only update status if it's not already completed
        if (cpfRequest.status !== "completed") {
          cpfRequest.status = "completed";
        }
        // Keep officerDecision.status as approved since it can't be completed
        await cpfRequest.save();
      }
    }

    // Format response according to API spec
    res.send({
      id: updatedAppointment._id,
      status: updatedAppointment.status,
      updatedAt: updatedAppointment.updatedAt,
      updatedBy: updatedAppointment.updatedBy
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { newDateTime, reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    // Check authorization (must be the appointment owner or an officer)
    if (appointment.userId.toString() !== req.userId && !req.isOfficer) {
      return res.status(403).send({
        message: "Not authorized to reschedule this appointment"
      });
    }

    // Validate new date
    const newDate = new Date(newDateTime);
    if (isNaN(newDate.getTime())) {
      return res.status(400).send({
        message: "Invalid date format for newDateTime"
      });
    }

    // Store old date for response
    const oldDate = appointment.appointmentDate;

    // Update appointment
    appointment.appointmentDate = newDate;
    appointment.status = "scheduled"; // Set status back to scheduled when rescheduling
    appointment.rescheduleReason = reason;
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.userId;

    const updatedAppointment = await appointment.save();

    // If appointment was completed, update CPF request status back to approved
    if (appointment.status === "completed") {
      const cpfRequest = await CpfRequest.findById(appointment.cpfRequestId);
      if (cpfRequest) {
        cpfRequest.status = "approved";
        await cpfRequest.save();
      }
    }

    // Format response according to API spec
    res.send({
      id: updatedAppointment._id,
      oldDate: oldDate,
      newDate: updatedAppointment.appointmentDate,
      status: updatedAppointment.status,
      updatedAt: updatedAppointment.updatedAt
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found" });
    }

    // Check if user has officer role
    const user = await User.findById(req.userId).populate("roles");
    if (!user.roles.some(role => role.name === "officer")) {
      return res.status(403).send({
        message: "Not authorized. Only officers can delete appointments"
      });
    }

    // Update CPF request status
    const cpfRequest = await CpfRequest.findById(appointment.cpfRequestId);
    if (cpfRequest) {
      cpfRequest.status = "pending";
      cpfRequest.appointmentDate = null;
      await cpfRequest.save();
    }

    // Delete the appointment
    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).send({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
