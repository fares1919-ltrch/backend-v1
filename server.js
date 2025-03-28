const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const dbConfig = require("./app/config/db.config.js");

const app = express();
var corsOptions = {
  origin: "http://localhost:8081",
};

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "fares-session",
    keys: ["COOKIE_SECRET"],
    httpOnly: true,
  })
);

const db = require("./app/models");
const Role = db.role;

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
require("./app/routes/password.routes")(app);

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
