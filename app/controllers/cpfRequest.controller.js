const db = require("../models");
const CpfRequest = db.cpfRequest;
const User = db.user;
const CpfCredential = db.cpfCredential;

// Create a new CPF request
exports.create = async (req, res) => {
  try {
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

    // Validate birth date
    if (!req.body.birthDate) {
      return res.status(400).send({
        message: "Birth date is required"
      });
    }

    const birthDate = new Date(req.body.birthDate);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).send({
        message: "Invalid birth date format. Please use YYYY-MM-DD format"
      });
    }

    // Check if birth date is not in the future
    if (birthDate > new Date()) {
      return res.status(400).send({
        message: "Birth date cannot be in the future"
      });
    }

    // Validate training dates
    if (!req.body.startDate || !req.body.endDate) {
      return res.status(400).send({
        message: "Training start and end dates are required"
      });
    }

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).send({
        message: "Invalid date format for training dates. Please use ISO format."
      });
    }

    if (startDate < new Date()) {
      return res.status(400).send({
        message: "Training start date cannot be in the past"
      });
    }

    if (endDate <= startDate) {
      return res.status(400).send({
        message: "Training end date must be after start date"
      });
    }

    const request = new CpfRequest({
      userId: req.userId,
      identityNumber: req.body.identityNumber,
      birthDate: birthDate,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      duration: req.body.duration,
      cost: req.body.cost,
      status: "pending",
      officerDecision: {
        status: "pending"
      }
    });

    const savedRequest = await request.save();
    res.status(201).send(savedRequest);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

// Get all CPF requests (with filtering)
exports.findAll = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = {};

    // Apply filters
    if (status) query.status = status;
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

    const requests = await CpfRequest.find(query)
      .populate("userId", "username email firstName lastName")
      .sort({ createdAt: -1 });

    res.send(requests);
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

    if (request.status !== "pending") {
      return res.status(400).send({ message: "Can only update pending requests" });
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

// Delete CPF request (user can only delete their own pending requests)
exports.deleteRequest = async (req, res) => {
  try {
    const request = await CpfRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).send({ message: "Request not found" });
    }

    // Check if user has access to this request
    if (request.userId.toString() !== req.userId) {
      return res.status(403).send({ message: "Not authorized to delete this request" });
    }

    // Only allow deletion of pending requests
    if (request.status !== "pending") {
      return res.status(400).send({
        message: "Only pending requests can be deleted"
      });
    }

    // Delete the request
    await CpfRequest.findByIdAndDelete(req.params.id);

    res.status(200).send({ message: "Request deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
