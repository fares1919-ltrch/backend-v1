const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const dbConfig = require("./app/config/db.config.js");
const passport = require("passport");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require("./app/config/passport"); // Load Passport config
require("dotenv").config();

const app = express();

// Security headers middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

var corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:4200",
  credentials: true,
  allowHeaders: [
    "Origin, Content-Type, Accept, Authorization, X-Requested-With",
    "Access-Control-Allow-Origin",
  ],
  exposedHeaders: ["Content-Disposition"],
};

app.use(cors(corsOptions));

// Serve static files from uploads directory with CORS
app.use(
  "/uploads",
  (req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      process.env.CLIENT_URL || "http://localhost:4200"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(path.join(__dirname, "app/middlewares/uploads"))
);

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Cookie session middleware
app.use(
  cookieSession({
    name: "fares-session",
    keys: [process.env.SESSION_SECRET || "COOKIE_SECRET"],
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "lax",
    domain:
      process.env.NODE_ENV === "production" ? process.env.DOMAIN : "localhost",
  })
);

// Initialize Passport
app.use(passport.initialize());

const db = require("./app/models");
const Role = db.role;

app.options("*", cors(corsOptions)); // enable pre-flight request for all routes

db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`)
  .then(() => {
    console.log("Connected to the database!");
    initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to fares application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/profile.routes")(app);
require("./app/routes/cpfRequest.routes")(app);
require("./app/routes/appointment.routes")(app);
require("./app/routes/biometricData.routes")(app);
require("./app/routes/cpfCredential.routes")(app);
require("./app/routes/notification.routes")(app);
require("./app/routes/center.routes")(app);
require("./app/routes/stats.routes")(app);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).send({ message: "Not Found" });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

async function initial() {
  try {
    const count = await Role.estimatedDocumentCount(); // Use async/await
    if (count === 0) {
      await new Role({ name: "user" }).save();
      console.log("added 'user' to roles collection");
      await new Role({ name: "manager" }).save();
      console.log("added 'manager' to roles collection");
      await new Role({ name: "officer" }).save();
      console.log("added 'officer' to roles collection");
    }
  } catch (err) {
    console.log("error", err);
  }
}
