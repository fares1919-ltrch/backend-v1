const db = require("../models");
const Center = db.center;
const Appointment = db.appointment;
const createOrUpdateCenterSchedule = require("../utils/centerSchedule");
const moment = require('moment');

const controller = {};

/************************************************
 * CENTER RETRIEVAL
 * Get center information
 ************************************************/
// Get all centers
controller.getAllCenters = async (req, res) => {
  try {
    const centers = await Center.find({ status: "active" });

    // Format response with enhanced validation
    const formattedCenters = centers
      .filter((center) => {
        // Strict coordinate validation
        const lat = parseFloat(center.address.lat);
        const lon = parseFloat(center.address.lon);
        return (
          !isNaN(lat) &&
          !isNaN(lon) &&
          lat >= -90 &&
          lat <= 90 &&
          lon >= -180 &&
          lon <= 180
        );
      })
      .map((center) => ({
        id: center._id,
        name: center.name,
        region: center.region,
        address: {
          street: center.address.street,
          city: center.address.city,
          state: center.address.state,
          postalCode: center.address.postalCode,
          lat: center.address.lat,
          lon: center.address.lon,
        },
        capacity: center.capacity.hourly,
        workingHours: {
          start: center.workingHours.monday.start,
          end: center.workingHours.monday.end,
        },
      }));

    if (formattedCenters.length === 0) {
      console.log("Warning: No centers found with valid coordinates");
    }

    res.send({
      centers: formattedCenters,
    });
  } catch (err) {
    console.error("Error in getAllCenters:", err);
    res.status(500).send({ message: err.message });
  }
};

// Get center by ID
controller.getCenterById = async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }
    res.send(center);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CENTER MANAGEMENT
 * Create and update centers
 ************************************************/
// Create new center (Officer only)
controller.createCenter = async (req, res) => {
  try {
    console.log("\n🔍 DEBUG: Starting center creation process...");
    console.log("📋 Request body:", JSON.stringify(req.body, null, 2));

    const { name, address, region, capacity, workingHours, services, contact } = req.body;

    // Validate required fields
    console.log("🧪 Validating required fields...");
    
    if (!name) console.log("❌ Missing required field: name");
    if (!address) console.log("❌ Missing required field: address");
    if (!region) console.log("❌ Missing required field: region");
    
    if (address) {
      if (address.lat === undefined) console.log("❌ Missing required field: address.lat");
      if (address.lon === undefined) console.log("❌ Missing required field: address.lon");
      console.log("🌍 Address coordinates:", { lat: address.lat, lon: address.lon });
    } else {
      console.log("❌ Address object is missing entirely");
    }

    // Log validation check
    const isValid = name && address && region && address.lat !== undefined && address.lon !== undefined;
    console.log(`✅ Primary validation ${isValid ? 'passed' : 'failed'}`);

    if (!isValid) {
      return res.status(400).send({
        message: "Missing required fields: name, address, or region",
      });
    }

    // Create default working hours if not provided
    console.log("🕒 Checking working hours...");
    const defaultWorkingHours = {
      monday: { start: "08:00", end: "16:00" },
      tuesday: { start: "08:00", end: "16:00" },
      wednesday: { start: "08:00", end: "16:00" },
      thursday: { start: "08:00", end: "16:00" },
      friday: { start: "08:00", end: "13:00" },
      saturday: { start: "09:00", end: "12:00" },
      sunday: { start: "", end: "" }
    };

    // Merge provided working hours with defaults for any missing days
    const mergedWorkingHours = {
      ...defaultWorkingHours,
      ...(workingHours || {})
    };
    
    // Ensure all required days have both start and end
    for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
      if (!mergedWorkingHours[day]) {
        mergedWorkingHours[day] = defaultWorkingHours[day];
      } else {
        if (!mergedWorkingHours[day].start) {
          mergedWorkingHours[day].start = defaultWorkingHours[day].start;
        }
        if (!mergedWorkingHours[day].end) {
          mergedWorkingHours[day].end = defaultWorkingHours[day].end;
        }
      }
    }

    console.log("✅ Working hours prepared:", mergedWorkingHours);

    // Prepare default capacity if not provided
    const defaultCapacity = {
      daily: 48,
      hourly: 6
    };

    // Prepare center object
    console.log("🔧 Creating center object...");
    const center = new Center({
      name,
      address,
      region,
      capacity: capacity || defaultCapacity,
      workingHours: mergedWorkingHours,
      services: services || ["cpf", "biometric", "document"],
      contact: contact || { phone: "", email: "" },
      status: "active"
    });

    console.log("💾 Saving center to database...");
    const savedCenter = await center.save();
    console.log(`✅ Center created with ID: ${savedCenter._id}`);

    // Generate center schedule
    console.log("📅 Generating center schedule...");
    try {
      await createOrUpdateCenterSchedule(savedCenter._id);
      console.log("✅ Center schedule generated successfully");
    } catch (scheduleErr) {
      console.error("⚠️ Error generating center schedule:", scheduleErr.message);
      // Continue anyway since the center was created
    }

    console.log("🏁 Center creation process completed successfully");
    res.status(201).send(savedCenter);
  } catch (err) {
    console.error("❌ ERROR in createCenter:", {
      message: err.message,
      stack: err.stack,
      code: err.code
    });
    
    // Special handling for MongoDB duplicate key error
    if (err.code === 11000) {
      console.error("💡 Duplicate key error - center with this name may already exist");
      return res.status(400).send({ 
        message: "A center with this name already exists"
      });
    }
    
    res.status(500).send({ message: err.message });
  }
};

// Update center (Officer only)
controller.updateCenter = async (req, res) => {
  try {
    const center = await Center.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );

    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    res.send(center);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CENTER SCHEDULING AND STATISTICS
 * Get appointment information and center statistics
 ************************************************/
// Get center's daily schedule (Officer only)
controller.getCenterSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();

    const appointments = await Appointment.find({
      centerId: req.params.id,
      date: {
        $gte: new Date(queryDate.setHours(0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59)),
      },
    }).populate("userId", "username firstName lastName");

    res.send(appointments);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get center statistics (Officer only)
controller.getCenterStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { centerId: req.params.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query);
    const center = await Center.findById(req.params.id);

    if (!center) {
      return res.status(404).send({ message: "Center not found" });
    }

    // Calculate average processing time (in minutes)
    const completedAppointments = appointments.filter(
      (a) => a.status === "completed"
    );
    const avgProcessingTime =
      completedAppointments.length > 0
        ? completedAppointments.reduce((acc, curr) => {
            const start = new Date(curr.appointmentDate);
            const end = new Date(curr.updatedAt);
            return acc + (end - start) / (1000 * 60);
          }, 0) / completedAppointments.length
        : 0;

    // Calculate biometric collection success rate
    const biometricSuccess =
      completedAppointments.length > 0
        ? (completedAppointments.filter((a) => a.biometricDataCollected)
            .length /
            completedAppointments.length) *
          100
        : 0;

    // Format response according to API spec
    res.send({
      centerId: center._id,
      period: {
        start:
          startDate ||
          appointments[0]?.appointmentDate.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0],
        end:
          endDate ||
          appointments[appointments.length - 1]?.appointmentDate
            .toISOString()
            .split("T")[0] ||
          new Date().toISOString().split("T")[0],
      },
      stats: {
        totalAppointments: appointments.length,
        completed: completedAppointments.length,
        rescheduled: appointments.filter((a) => a.status === "rescheduled")
          .length,
        noShow: appointments.filter((a) => a.status === "no-show").length,
        averageProcessingTime: Math.round(avgProcessingTime),
        biometricCollectionSuccess: Number(biometricSuccess.toFixed(1)),
      },
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};































// Get center available slots
controller.getAvailableDays = async (req, res) => {
  try {
    console.log("Getting available days for center:", req.params);
    const { centerId } = req.params;
    const currentMonth = moment().format('YYYY-MM');
    
    // Find the schedule for current month
    const schedule = await db.centerSchedule.findOne({
      centerId,
      month: currentMonth
    });
    
    if (!schedule) {
      return res.status(404).send({ message: "No schedule found for this center" });
    }
    
    // Transform the days array - include all days including Sundays
    const availableDays = schedule.days.map(day => {
      // Check if it's Sunday (first character of date is the day of week)
      const date = new Date(day.date);
      const isSunday = date.getDay() === 0;
     
      
      return {
        date: day.date,
        availableSlots: isSunday ? -1 : (day.capacity - day.reservedSlots)
      };
    });
    // console.log("Available days:", availableDays);
    
    res.status(200).send(availableDays);
  } catch (err) {
    console.error(`Error getting available days: ${err.message}`);
    res.status(500).send({ message: err.message });
  }
};

module.exports = controller;
