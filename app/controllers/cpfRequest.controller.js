const db = require("../models");
const CpfRequest = db.cpfRequest;
const User = db.user;
const CpfCredential = db.cpfCredential;

/************************************************
 * CPF REQUEST CREATION
 * Create and validate new CPF requests
 ************************************************/
// Create a new CPF request
exports.create = async (req, res) => {
  try {
    console.log(req.body, "data")
    console.log("userid" , req.body.userId)
    // Check if user already has an active request
    const existingRequest = await CpfRequest.findOne({
      userId: req.userId,
      status: { $in: ["approved", "pending", "completed"] }
    });

    if (existingRequest) {
      return res.status(400).send({
        message: "You already have an active CPF request or credential. Only one request is allowed."
      });
    }

    // Check if identity number is already in use
    const existingIdentity = await CpfRequest.findOne({
      identityNumber: req.body.identityNumber,
      status: { $in: ["approved", "pending", "completed"] }
    });

    if (existingIdentity) {
      return res.status(400).send({
        message: "This identity number is already associated with an active CPF request or credential."
      });
    }

    // Validate identity number (basic validation)
    if (!req.body.identityNumber || req.body.identityNumber.length < 5) {
      return res.status(400).send({
        message: "Valid identity number is required"
      });
    }

    // Validate address structure
    const address = req.body.address;
    if (!address || address.lat === undefined || address.lon === undefined) {
      return res.status(400).send({ message: `Missing address field: lat or lon` });
    }

    // Validate centerId
    if (!req.body.centerId) {
      return res.status(400).send({ message: 'Missing centerId in request' });
    }

    const request = new CpfRequest({
      userId: req.userId,
      identityNumber: req.body.identityNumber,
      address: address,
      cost: req.body.cost,
      status: "pending",
      officerDecision: {
        status: "pending"
      },
      centerId: req.body.centerId
    });

    const savedRequest = await request.save();
    res.status(201).send(savedRequest);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CPF REQUEST RETRIEVAL
 * Find requests with various filters
 ************************************************/
// Get all CPF requests (with filtering)
exports.findAll = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};

    // Apply filters
    if (status) {
      // Allow multiple statuses (comma-separated)
      const statuses = status.split(',');
      query.status = { $in: statuses };
    }
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Check user role
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map(role => role.name);

    if (roles.includes("officer")) {
      // Officers see all requests
    } else {
      // Regular users see only their requests
      query.userId = req.userId;
    }

    // Use mongoose-paginate-v2 for consistent pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: "userId", select: "username email firstName lastName" }
    };
    const result = await CpfRequest.paginate(query, options);

    res.send({
      requests: result.docs,
      totalPages: result.totalPages,
      currentPage: result.page,
      totalItems: result.totalDocs
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get a single CPF request by ID
exports.findOne = async (req, res) => {
  try {
    const request = await CpfRequest.findById(req.params.id)
      .populate("userId", "username email firstName lastName")
      .populate("officerDecision.decidedBy", "username email firstName lastName");

    if (!request) {
      return res.status(404).send({ message: "Request not found" });
    }

    // Check if user has access to this request
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map(role => role.name);

    if (!roles.includes("officer") && request.userId.toString() !== req.userId) {
      return res.status(403).send({ message: "Not authorized to view this request" });
    }

    // If request is approved, check if credential exists
    if (request.status === "approved") {
      const credential = await CpfCredential.findOne({ cpfRequestId: request._id });
      if (credential) {
        request._doc.credential = credential;
      }
    }

    res.send(request);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get user's CPF request status
exports.getUserRequest = async (req, res) => {
  try {
    const request = await CpfRequest.findOne({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate("officerDecision.decidedBy", "username email firstName lastName");

    if (!request) {
      return res.status(404).send({ message: "No request found" });
    }

    // If request is approved or completed, include credential info
    if (request.status === "approved" || request.status === "completed") {
      const credential = await CpfCredential.findOne({ cpfRequestId: request._id });
      if (credential) {
        request._doc.credential = credential;
      }
    }

    res.send(request);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all pending CPF requests (officer only)
exports.getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: {
        [sortBy]: order === 'desc' ? -1 : 1
      }
    };

    // First populate the userId field
    const populatedRequest = CpfRequest.find({ status: "pending" })
      .populate("userId", "username email firstName lastName");

    // Then paginate the results
    const requests = await populatedRequest.paginate(options);

    res.send({
      requests: requests.docs,
      totalPages: requests.totalPages,
      currentPage: requests.page
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/************************************************
 * CPF REQUEST MANAGEMENT
 * Update and delete requests
 ************************************************/
// Officer: Update request decision
exports.updateDecision = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("roles");
    const roles = user.roles.map(role => role.name);

    if (!roles.includes("officer")) {
      return res.status(403).send({ message: "Not authorized. Only officers can update request decisions." });
    }

    const request = await CpfRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).send({ message: "Request not found" });
    }

    // Only officers can set status to 'completed', and only if appointment is completed
    if (req.body.status === 'completed') {
      // Officer check is already performed above
      // Check if related appointment exists and is completed
      const appointment = await require('../models').appointment.findOne({ cpfRequestId: request._id });
      if (!appointment || appointment.status !== 'completed') {
        return res.status(400).send({ message: "Cannot complete request until appointment is completed." });
      }
    }
    if (req.body.status === 'approved') {
      const Appointment = require('../models').appointment;
      // Check if appointment already exists for this CPF request
      let appointment = await Appointment.findOne({ cpfRequestId: request._id });
      if (!appointment) {
        // You may want to set appointmentDate and location based on your business rules or request data
        appointment = new Appointment({
          userId: request.userId,
          officerId: req.userId,
          cpfRequestId: request._id,
          appointmentDate: new Date(), // or req.body.appointmentDate if provided
          status: "scheduled",
          notes: "Auto-created upon approval",
          location: request.centerId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await appointment.save();
      }
    }

    // Prevent marking CPF request as completed unless appointment is completed
    if (req.body.status === 'completed') {
      const Appointment = require('../models').appointment;
      const appointment = await Appointment.findOne({ cpfRequestId: request._id });
      if (!appointment || appointment.status !== 'completed') {
        return res.status(400).send({ message: "Cannot complete CPF request until the associated appointment is completed." });
      }
    }
    // No need to validate appointment date here anymore
    request.status = req.body.status;
    request.officerDecision = {
      status: req.body.status,
      comments: req.body.comments, // Changed from comment to comments to match API spec
      decidedAt: new Date(),
      decidedBy: req.userId
    };

    const updatedRequest = await request.save();

    // Format response to match API spec
    const response = {
      id: updatedRequest._id,
      status: updatedRequest.status,
      officerDecision: {
        status: updatedRequest.officerDecision.status,
        comments: updatedRequest.officerDecision.comments,
        decidedBy: updatedRequest.officerDecision.decidedBy,
        decidedAt: updatedRequest.officerDecision.decidedAt
      }
    };

    res.send(response);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Delete CPF request by ID
exports.deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    console.log(`🗑️ Attempting to delete CPF request with ID: ${requestId}`);
    
    // Find the request first to confirm it exists
    const cpfRequest = await db.cpfRequest.findById(requestId);
    
    if (!cpfRequest) {
      console.log(`❌ CPF request with ID ${requestId} not found`);
      return res.status(404).send({ 
        message: "CPF request not found" 
      });
    }
    
    // Check if there's an associated appointment
    const appointment = await db.appointment.findOne({ cpfRequestId: requestId });
    
    if (appointment) {
      console.log(`🔄 Deleting associated appointment ID: ${appointment._id}`);
      await db.appointment.findByIdAndDelete(appointment._id);
    }
    
    // Delete the request
    await db.cpfRequest.findByIdAndDelete(requestId);
    
    console.log(`✅ Successfully deleted CPF request with ID: ${requestId}`);
    
    res.status(200).send({ 
      message: "CPF request deleted successfully",
      deletedRequestId: requestId,
      appointmentDeleted: appointment ? true : false
    });
    
  } catch (err) {
    console.error(`❌ Error deleting CPF request: ${err.message}`);
    res.status(500).send({ 
      message: "Error deleting CPF request", 
      error: err.message 
    });
  }
};

exports.PendingReq = async (req, res) => {
  try {
    console.log("🔍 Fetching pending and approved CPF requests...");
    
    const allRequests = await CpfRequest.find({
      status: 'pending'
    })
      .populate({
        path: "userId",
        select: "username"
      })
      .populate({
        path: "centerId",
        select: "name"
      })
      .select('_id userId address status centerId createdAt')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${allRequests.length} requests (pending and approved)`);

    // Transform to get exactly the fields we want
    const formattedRequests = allRequests.map(request => ({
      requestId: request._id,
      username: request.userId?.username || 'N/A',
      userId: request.userId?._id || 'N/A',
      address: request.address,
      status: request.status,
      centerId: request.centerId?._id || 'N/A',
      centerName: request.centerId?.name || 'N/A',
      createdAt: request.createdAt
    }));

    // Debug log to verify the data format
    formattedRequests.forEach((req, index) => {
      console.log(`\nRequest #${index + 1}:`, {
        requestId: req.requestId,
        username: req.username,
        status: req.status,
        centerName: req.centerName
      });
    });

    res.status(200).json({
      requests: formattedRequests,
      total: formattedRequests.length
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).send({ message: err.message });
  }
};