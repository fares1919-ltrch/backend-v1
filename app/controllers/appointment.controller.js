const db = require("../models");
const Appointment = db.appointment;
const CpfRequest = db.cpfRequest;
const Center = db.center;
const User = db.user;

/************************************************
 * APPOINTMENT CREATION
 * Create new appointment for approved CPF requests
 ************************************************/
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

/************************************************
 * APPOINTMENT RETRIEVAL
 * Get appointments by different criteria
 ************************************************/
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

// Get appointment by CPF request ID
exports.getAppointmentByRequestId = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ cpfRequestId: req.params.cpfRequestId })
      .populate("userId", "username email firstName lastName")
      .populate("officerId", "username email firstName lastName");
    if (!appointment) {
      return res.status(404).send({ message: "No appointment found for this CPF request" });
    }
    res.send(appointment);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * SCHEDULING MANAGEMENT
 * Manage appointment scheduling and time slots
 ************************************************/
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

/************************************************
 * APPOINTMENT STATUS MANAGEMENT
 * Update appointment status (complete/cancel/etc)
 ************************************************/
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

/************************************************
 * APPOINTMENT MODIFICATION
 * Reschedule or delete appointments
 ************************************************/
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

exports.checkAndCreateAppointment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { dateTime } = req.body;

    console.log("🔍 Checking appointment availability for:", {
      requestId,
      dateTime
    });

    // Validate CPF request exists
    const cpfRequest = await CpfRequest.findById(requestId);
    if (!cpfRequest) {
      return res.status(404).json({ message: "CPF request not found" });
    }

    // Get the center information
    const center = await Center.findById(cpfRequest.centerId);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    // Parse the dateTime
    const appointmentDate = new Date(dateTime);
    
    // Correct way to get day of week
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[appointmentDate.getDay()];
    const timeString = appointmentDate.toTimeString().slice(0, 5); // HH:MM format

    console.log("📅 Checking availability for:", {
      day: dayOfWeek,
      time: timeString,
      centerWorkingHours: center.workingHours[dayOfWeek]
    });

    // Check if the center is open on this day
    if (!center.workingHours[dayOfWeek] || 
        !center.workingHours[dayOfWeek].start || 
        !center.workingHours[dayOfWeek].end) {
      return res.status(400).json({ 
        message: `The center is not open on ${dayOfWeek}` 
      });
    }

    // Check if time is within working hours
    const startTime = center.workingHours[dayOfWeek].start;
    const endTime = center.workingHours[dayOfWeek].end;
    
    if (timeString < startTime || timeString > endTime) {
      return res.status(400).json({ 
        message: `The center is only open from ${startTime} to ${endTime} on ${dayOfWeek}` 
      });
    }

    // Check if there's already an appointment at this time
    const existingAppointment = await Appointment.findOne({
      location: center._id,
      appointmentDate: appointmentDate,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        message: "This time slot is not available" 
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      userId: cpfRequest.userId,
      officerId: req.userId, // Current officer's ID
      cpfRequestId: cpfRequest._id,
      appointmentDate: appointmentDate,
      location: center._id,
      status: "scheduled"
    });

    await appointment.save();

    // Update CPF request status
    cpfRequest.status = "approved";
    cpfRequest.appointmentDate = appointmentDate;
    await cpfRequest.save();

    console.log("✅ Appointment created successfully:", {
      appointmentId: appointment._id,
      requestId: cpfRequest._id,
      status: appointment.status,
      date: appointmentDate,
      dayOfWeek,
      timeString
    });

    res.status(200).json({ 
      message: "Appointment created",
      appointment: {
        id: appointment._id,
        date: appointmentDate,
        center: center.name,
        status: appointment.status,
        cpfRequest: {
          id: cpfRequest._id,
          status: cpfRequest.status
        }
      }
    });

  } catch (err) {
    console.error("❌ Error in checkAndCreateAppointment:", err);
    res.status(500).json({ 
      message: "Error processing appointment request",
      error: err.message 
    });
  }
};

// Schedule appointment and approve CPF request
exports.createAppointement = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).send({ message: "Date is required" });
    }
    
    console.log(`🔄 Scheduling appointment for request ${requestId} on ${date}`);
    
    // Find the CPF request
    const cpfRequest = await db.cpfRequest.findById(requestId);
    if (!cpfRequest) {
      return res.status(404).send({ message: "CPF request not found" });
    }
    
    // Check if request already has an appointment
    const existingAppointment = await db.appointment.findOne({ cpfRequestId: requestId });
    if (existingAppointment) {
      return res.status(400).send({ 
        message: "This CPF request already has an appointment scheduled",
        existingAppointment: {
          id: existingAppointment._id,
          dateTime: existingAppointment.appointmentDate,
          status: existingAppointment.status
        }
      });
    }
    
    // Check if request is already approved
    if (cpfRequest.status === "approved" || cpfRequest.status === "completed") {
      return res.status(400).send({ 
        message: `Cannot schedule appointment: CPF request status is already '${cpfRequest.status}'`
      });
    }
    
    // Get month in YYYY-MM format
    const month = date.substring(0, 7);
    
    // Find center schedule
    const centerSchedule = await db.centerSchedule.findOne({
      centerId: cpfRequest.centerId,
      month: month
    });
    
    if (!centerSchedule) {
      return res.status(404).send({ message: "Center schedule not found for this month" });
    }
    
    // Find the specific day
    const day = centerSchedule.days.find(d => d.date === date);
    if (!day) {
      return res.status(404).send({ message: "Date not found in center schedule" });
    }
    
    // Check if day is Sunday or no capacity
    if (new Date(date).getDay() === 0 || day.capacity === 0) {
      return res.status(400).send({ message: "This day is not available for appointments" });
    }
    
    // Check if slots are available
    if (day.reservedSlots >= day.capacity) {
      return res.status(400).send({ message: "No available slots for this date" });
    }
    
    // Generate time between opening and closing hours
    const openingTime = day.openingTime;
    const closingTime = day.closingTime;
    
    // Convert opening and closing times to minutes since midnight
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    
    // Standard appointment slot duration
    const slotDuration = 10; // 10 minutes per slot
    
    // Get already reserved times for this day and convert to minutes
    const reservedTimes = day.reservedSlotsDetails.map(detail => {
      const [hour, minute] = detail.time.split(':').map(Number);
      return hour * 60 + minute;
    });
    
    // Generate all possible time slots
    const allPossibleSlots = [];
    for (let timeMinutes = openMinutes; timeMinutes < closeMinutes - slotDuration; timeMinutes += slotDuration) {
      allPossibleSlots.push(timeMinutes);
    }
    
    // Filter out the reserved slots and slots too close to reserved times
    const availableSlots = allPossibleSlots.filter(slotMinutes => {
      // Check if this slot or any slot too close to it is already reserved
      return !reservedTimes.some(reservedMinutes => 
        Math.abs(reservedMinutes - slotMinutes) < slotDuration
      );
    });
    
    if (availableSlots.length === 0) {
      return res.status(400).send({ message: "No available time slots for this date" });
    }
    
    // Randomly select one of the available slots
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    const selectedSlotMinutes = availableSlots[randomIndex];
    
    // Convert back to hours and minutes
    const selectedHour = Math.floor(selectedSlotMinutes / 60);
    const selectedMinute = selectedSlotMinutes % 60;
    const selectedSlot = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    
    console.log(`🕒 Generated appointment time: ${selectedSlot}`);
    
    // Create full date-time string and convert to Date object
    const appointmentDateTime = new Date(`${date}T${selectedSlot}:00`);
    
    // Create appointment
    const appointment = new db.appointment({
      userId: cpfRequest.userId,
      officerId: req.userId, // Current user (officer)
      cpfRequestId: cpfRequest._id,
      appointmentDate: appointmentDateTime,
      location: cpfRequest.centerId,
      status: "scheduled"
    });
    
    const savedAppointment = await appointment.save();
    console.log(`✅ Appointment created with ID: ${savedAppointment._id}`);
    
    // Update day in center schedule
    day.reservedSlots += 1;
    day.reservedSlotsDetails.push({
      time: selectedSlot,
      appointmentId: savedAppointment._id,
      userId: cpfRequest.userId
    });
    
    await centerSchedule.save();
    console.log(`✅ Center schedule updated for ${date} with time ${selectedSlot}`);
    
    // Update CPF request status
    cpfRequest.status = "approved";
    cpfRequest.appointmentDate = appointmentDateTime;
    await cpfRequest.save();
    console.log(`✅ CPF request ${requestId} status updated to approved`);
    
    res.status(200).send({
      message: "Appointment scheduled successfully",
      appointment: {
        id: savedAppointment._id,
        dateTime: appointmentDateTime,
        time: selectedSlot,
        status: "scheduled"
      },
      cpfRequest: {
        id: cpfRequest._id,
        status: cpfRequest.status
      }
    });
    
  } catch (err) {
    console.error(`❌ Error scheduling appointment: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

// Get upcoming appointments
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set to tomorrow
    tomorrow.setHours(0, 0, 0, 0); // Reset time to midnight
    
    const appointments = await Appointment.find({
      appointmentDate: { $gte: tomorrow },
    })
    .populate('userId', 'firstName lastName')
    .populate('location', 'name')
    .populate('cpfRequestId')
    .sort({ appointmentDate: 1 });

    const formattedAppointments = appointments.map(appointment => {
      const time = appointment.appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const name = appointment.userId?.firstName + " " + appointment.userId?.lastName;
      return {
        appointmentId: appointment._id,
        userId: appointment.userId?._id,
        status: appointment.status,
        service: appointment.service ,
        time: time,
        date: appointment.appointmentDate.toISOString().split('T')[0],
        centerName: appointment.location?.name ,
        name: name,
      };
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update appointment status to cancelled
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    appointment.status = "cancelled";
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.userId;

    await appointment.save();

    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment: {
        id: appointment._id,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update appointment status to completed
exports.completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    appointment.status = "completed";
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.userId;

    await appointment.save();

    // If appointment is completed, update CPF request status
    if (appointment.cpfRequestId) {
      const cpfRequest = await CpfRequest.findById(appointment.cpfRequestId);
      if (cpfRequest && cpfRequest.status !== "completed") {
        cpfRequest.status = "completed";
        await cpfRequest.save();
      }
    }

    res.status(200).json({
      message: "Appointment completed successfully",
      appointment: {
        id: appointment._id,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update appointment status to missed
exports.missAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update appointment status
    appointment.status = "missed";
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.userId;

    await appointment.save();

    res.status(200).json({
      message: "Appointment marked as missed",
      appointment: {
        id: appointment._id,
        status: appointment.status,
        updatedAt: appointment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error marking appointment as missed:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get today's appointments
exports.getTodayAppointments = async (req, res) => {
  try {
    // Get today's date boundaries
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Query appointments with appointmentDate between startOfDay and endOfDay
    const todayAppointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
    .populate('userId', 'firstName lastName')
    .populate('location', 'name')
    .populate('cpfRequestId');

    // Format the response
    const formattedAppointments = todayAppointments.map(appointment => {
      // Convert time to 12-hour format
      const time = appointment.appointmentDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const name = appointment.userId?.firstName + " " + appointment.userId?.lastName;
      return {
        appointmentId: appointment._id,
        userId: appointment.userId?._id,
        status: appointment.status,
        service: appointment.service ,
        time: time,
        date: appointment.appointmentDate.toISOString().split('T')[0],
        centerName: appointment.location?.name ,
        name: name,
      };
    });

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};