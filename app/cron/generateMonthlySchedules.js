// cron/generateMonthlySchedules.js
const mongoose = require("mongoose");
const cron = require("node-cron");
const Center = require("../models/center.model");
const createOrUpdateCenterSchedule = require("../utils/centerSchedule");

// Connect to DB (tu peux adapter l’URI à ton projet)
const connectDB = async () => {
  await mongoose.connect("mongodb://localhost:27017/identitySecureDB", {
    
  });
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
