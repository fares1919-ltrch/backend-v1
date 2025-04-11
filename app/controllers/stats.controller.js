const db = require("../models");
const CpfRequest = db.cpfRequest;
const BiometricData = db.biometricData;
const Appointment = db.appointment;
const Center = db.center;

// Get CPF request statistics
const getCpfRequestStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const requests = await CpfRequest.find(query);
    const stats = {
      total: requests.length,
      approved: requests.filter(r => r.status === "approved").length,
      rejected: requests.filter(r => r.status === "rejected").length,
      pending: requests.filter(r => r.status === "pending").length,
      completed: requests.filter(r => r.status === "completed").length
    };

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get biometric data statistics
const getBiometricStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const biometrics = await BiometricData.find(query);
    const stats = {
      total: biometrics.length,
      withFingerprints: biometrics.filter(b => b.fingerprints && b.fingerprints.length > 0).length,
      withFace: biometrics.filter(b => b.faceImage).length,
      withIris: biometrics.filter(b => b.irisScans && b.irisScans.length > 0).length
    };

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get appointment statistics
const getAppointmentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query);
    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === "completed").length,
      cancelled: appointments.filter(a => a.status === "cancelled").length,
      noShow: appointments.filter(a => a.status === "no-show").length,
      rescheduled: appointments.filter(a => a.rescheduledFrom).length
    };

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get regional statistics
const getRegionalStats = async (req, res) => {
  try {
    const centers = await Center.find();
    const regions = [...new Set(centers.map(c => c.region))];
    const stats = [];

    for (const region of regions) {
      const centerIds = centers.filter(c => c.region === region).map(c => c.id);
      const appointments = await Appointment.find({ centerId: { $in: centerIds } });
      const requests = await CpfRequest.find({ centerId: { $in: centerIds } });

      stats.push({
        region,
        centers: centerIds.length,
        appointments: appointments.length,
        requests: requests.length,
        completed: appointments.filter(a => a.status === "completed").length
      });
    }

    res.send(stats);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get system overview statistics
const getSystemOverview = async (req, res) => {
  try {
    const [requests, appointments, centers, biometrics] = await Promise.all([
      CpfRequest.countDocuments(),
      Appointment.countDocuments(),
      Center.countDocuments(),
      BiometricData.countDocuments()
    ]);

    res.send({
      totalRequests: requests,
      totalAppointments: appointments,
      totalCenters: centers,
      totalBiometrics: biometrics,
      lastUpdated: new Date()
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

module.exports = {
  getCpfRequestStats,
  getBiometricStats,
  getAppointmentStats,
  getRegionalStats,
  getSystemOverview
};
