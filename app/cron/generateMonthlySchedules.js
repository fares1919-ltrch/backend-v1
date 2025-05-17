// cron/generateMonthlySchedules.js
require("dotenv").config();
const mongoose = require("mongoose");
const cron = require("node-cron");
const Center = require("../models/center.model");
const createOrUpdateCenterSchedule = require("../utils/centerSchedule");
const dbConfig = require("../config/db.config");

// Connect to DB using config values
const connectDB = async () => {
  const uri = `mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`;
  await mongoose.connect(uri, {});
};

const scheduleMonthlyUpdate = async () => {
  await connectDB();

  // Cron: Tous les 1ers du mois à minuit
  cron.schedule("0 0 1 * *", async () => {
    const centers = await Center.find();

    for (const center of centers) {
      await createOrUpdateCenterSchedule(center._id);
    }
  });
};

module.exports = scheduleMonthlyUpdate;
