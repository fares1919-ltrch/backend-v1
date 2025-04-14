const db = require("../models");
const Center = db.center;
const Appointment = db.appointment;

const controller = {};

// Get all centers
controller.getAllCenters = async (req, res) => {
  try {
    const centers = await Center.find({ status: "active" });
    
    // Format response according to API spec
    const formattedCenters = centers.map(center => ({
      id: center._id,
      name: center.name,
      region: center.region,
      address: center.address.street + ", " + center.address.city,
      capacity: center.capacity.hourly,
      workingHours: {
        start: center.workingHours.monday.start, // Using Monday as default
        end: center.workingHours.monday.end
      },
      lat:center.address.lat,
      lon:center.address.lon
    }));

    res.send({
      centers: formattedCenters
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
    console.log(err.message)
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

// Create new center (Officer only)
controller.createCenter = async (req, res) => {
  try {
    const { name, address, region, capacity, workingHours } = req.body;

    // Validate required fields
    if (!name || !address || !region || !capacity || !workingHours || address.lat === undefined || address.lon===undefined) {
      return res.status(400).send({
        message: "Missing required fields"
      });
    }

    const center = new Center({
      name,
      address,
      region,
      capacity,
      workingHours,
      status: "active"
    });

    const savedCenter = await center.save();
    res.status(201).send(savedCenter);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Update center (Officer only)
controller.updateCenter = async (req, res) => {
  try {
    const center = await Center.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body
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

// Get center's daily schedule (Officer only)
controller.getCenterSchedule = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();

    const appointments = await Appointment.find({
      centerId: req.params.id,
      date: {
        $gte: new Date(queryDate.setHours(0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59))
      }
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
    const completedAppointments = appointments.filter(a => a.status === "completed");
    const avgProcessingTime = completedAppointments.length > 0 ? 
      completedAppointments.reduce((acc, curr) => {
        const start = new Date(curr.appointmentDate);
        const end = new Date(curr.updatedAt);
        return acc + (end - start) / (1000 * 60);
      }, 0) / completedAppointments.length : 0;

    // Calculate biometric collection success rate
    const biometricSuccess = completedAppointments.length > 0 ?
      (completedAppointments.filter(a => a.biometricDataCollected).length / completedAppointments.length * 100) : 0;

    // Format response according to API spec
    res.send({
      centerId: center._id,
      period: {
        start: startDate || appointments[0]?.appointmentDate.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        end: endDate || appointments[appointments.length - 1]?.appointmentDate.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]
      },
      stats: {
        totalAppointments: appointments.length,
        completed: completedAppointments.length,
        rescheduled: appointments.filter(a => a.status === "rescheduled").length,
        noShow: appointments.filter(a => a.status === "no-show").length,
        averageProcessingTime: Math.round(avgProcessingTime),
        biometricCollectionSuccess: Number(biometricSuccess.toFixed(1))
      }
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = controller;
