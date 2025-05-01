const db = require("../models");
const Appointment = db.appointment;
const CpfRequest = db.cpfRequest;
const Center = db.center;
const User = db.user;


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


// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    console.log("rescheduleAppointment", req.body, req.params);
    console.log("req.userId", req.userId);
    console.log("requestId params", req.params.requestId);
    
    const { date } = req.body;
    const requestId = req.params.requestId; // This is the CPF request ID
    
    // First get the CPF request to find the associated userId
    const cpfRequestData = await CpfRequest.findById(requestId);
    if (!cpfRequestData) {
      return res.status(404).send({ message: "CPF request not found" });
    }
    console.log("cpfRequestData", cpfRequestData);
    // Now find the appointment using the CPF request ID
    const appointment = await Appointment.findOne({ cpfRequestId: requestId });
    if (!appointment) {
      return res.status(404).send({ message: "Appointment not found for this CPF request" });
    }
    console.log("appointment", appointment);
    // Check authorization (must be the appointment owner or an officer)
    if (cpfRequestData.userId.toString() !== req.userId && !req.isOfficer) {
      return res.status(403).send({
        message: "Not authorized to reschedule this appointment"
      });
    }

    // Validate new date
    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return res.status(400).send({
        message: "Invalid date format for date"
      });
    }

    // Store old date for response and schedule updates
    const oldDate = appointment.appointmentDate;
    const oldDateString = oldDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const oldTimeString = oldDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    // Format newDate for validation and scheduling
    const newDateString = newDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const newDateDay = newDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get center information to check operating hours
    const center = await Center.findById(appointment.location);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Get workingHours for the day of the week
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = daysOfWeek[newDateDay];
    
    // Check if center is open on that day
    if (!center.workingHours[dayName] || !center.workingHours[dayName].start || !center.workingHours[dayName].end) {
      return res.status(400).send({
        message: `The center is closed on ${dayName}`
      });
    }

    // Get opening and closing times
    const openingTime = center.workingHours[dayName].start;
    const closingTime = center.workingHours[dayName].end;
    
    // Convert opening and closing times to minutes since midnight
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);
    const openMinutes = openHour * 60 + openMinute;
    const closeMinutes = closeHour * 60 + closeMinute;
    
    // Prepare to update center schedule
    // 1. Find old schedule month and new schedule month
    const oldMonth = oldDateString.substring(0, 7); // YYYY-MM
    const newMonth = newDateString.substring(0, 7); // YYYY-MM
    
    // 2. Get old schedule
    const oldCenterSchedule = await db.centerSchedule.findOne({
      centerId: appointment.location,
      month: oldMonth
    });
    
    if (!oldCenterSchedule) {
      return res.status(404).send({ message: "Old center schedule not found" });
    }
    
    // 3. Get new schedule (might be the same as old if same month)
    let newCenterSchedule;
    if (oldMonth === newMonth) {
      newCenterSchedule = oldCenterSchedule;
    } else {
      newCenterSchedule = await db.centerSchedule.findOne({
        centerId: appointment.location,
        month: newMonth
      });
      
      if (!newCenterSchedule) {
        return res.status(404).send({ message: "New center schedule not found" });
      }
    }
    
    // 4. Find the old day in old schedule
    const oldDay = oldCenterSchedule.days.find(d => d.date === oldDateString);
    if (!oldDay) {
      return res.status(404).send({ message: "Old date not found in center schedule" });
    }
    
    // 5. Find the new day in new schedule
    const newDay = newCenterSchedule.days.find(d => d.date === newDateString);
    if (!newDay) {
      return res.status(404).send({ message: "New date not found in center schedule" });
    }
    
    // 6. Check if new day has available capacity
    if (newDay.reservedSlots >= newDay.capacity) {
      return res.status(400).send({ message: "No available slots for the new date" });
    }
    
    // Standard appointment slot duration in minutes
    const slotDuration = 10;
    
    // Generate all possible time slots
    const allPossibleSlots = [];
    for (let timeMinutes = openMinutes; timeMinutes < closeMinutes - slotDuration; timeMinutes += slotDuration) {
      allPossibleSlots.push(timeMinutes);
    }
    
    if (allPossibleSlots.length === 0) {
      return res.status(400).send({ 
        message: `No available time slots for ${dayName} between ${openingTime} and ${closingTime}` 
      });
    }
    
    // Get already reserved times for this day and convert to minutes
    const reservedTimes = newDay.reservedSlotsDetails.map(detail => {
      const [hour, minute] = detail.time.split(':').map(Number);
      return hour * 60 + minute;
    });
    
    // Filter out the reserved slots and slots too close to reserved times
    const availableSlots = allPossibleSlots.filter(slotMinutes => {
      // Check if this slot or any slot too close to it is already reserved
      return !reservedTimes.some(reservedMinutes => 
        Math.abs(reservedMinutes - slotMinutes) < slotDuration
      );
    });
    
    if (availableSlots.length === 0) {
      return res.status(400).send({ message: "No available time slots for this date due to existing reservations" });
    }
    
    // Randomly select one of the available slots
    const randomIndex = Math.floor(Math.random() * availableSlots.length);
    const selectedSlotMinutes = availableSlots[randomIndex];
    
    // Convert back to hours and minutes
    const selectedHour = Math.floor(selectedSlotMinutes / 60);
    const selectedMinute = selectedSlotMinutes % 60;
    const selectedSlot = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    
    console.log(`Generated appointment time: ${selectedSlot} for date ${newDateString}`);
    
    // Create full date-time string and convert to Date object
    const newAppointmentDateTime = new Date(`${newDateString}T${selectedSlot}:00`);
    
    // Update the newDate with the generated time
    newDate.setHours(selectedHour, selectedMinute, 0, 0);

    // 7. Find and remove old slot from reserved slots details
    const oldSlotIndex = oldDay.reservedSlotsDetails.findIndex(
      slot => slot.appointmentId && slot.appointmentId.toString() === appointment._id.toString()
    );
    
    if (oldSlotIndex === -1) {
      console.warn(`Warning: Could not find appointment ${appointment._id} in schedule for ${oldDateString}`);
    } else {
      oldDay.reservedSlotsDetails.splice(oldSlotIndex, 1);
      oldDay.reservedSlots = Math.max(0, oldDay.reservedSlots - 1);
    }
    
    // 8. Add new slot to reserved slots details
    newDay.reservedSlotsDetails.push({
      time: selectedSlot,
      appointmentId: appointment._id,
      userId: appointment.userId
    });
    newDay.reservedSlots += 1;
    
    // 9. Save the schedule changes
    if (oldMonth === newMonth) {
      // If same month, save once
      await oldCenterSchedule.save();
    } else {
      // If different months, save both schedules
      await oldCenterSchedule.save();
      await newCenterSchedule.save();
    }
    
    // Update appointment
    appointment.appointmentDate = newDate;
    appointment.status = "scheduled"; // Reset status to scheduled when rescheduling
    appointment.updatedAt = new Date();
    appointment.updatedBy = req.userId;

    const updatedAppointment = await appointment.save();
    
    // Update CPF request appointment date - use the cpfRequestData we already retrieved
    cpfRequestData.appointmentDate = newDate;
    if (cpfRequestData.status === "completed") {
      cpfRequestData.status = "approved"; // If request was completed, reset status
    }
    await cpfRequestData.save();

    // Format response according to API spec
    res.send({
      id: updatedAppointment._id,
      oldDate: oldDate,
      newDate: updatedAppointment.appointmentDate,
      status: updatedAppointment.status,
      updatedAt: updatedAppointment.updatedAt
    });
  } catch (err) {
    console.error("Error rescheduling appointment:", err);
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