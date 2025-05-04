const moment = require("moment");
const db = require("../models");
const CenterSchedule = db.centerSchedule;

const createOrUpdateCenterSchedule = async (centerId) => {
  try {
    const today = moment();
    const currentMonth = today.format("YYYY-MM");
    const startOfMonth = today.clone().startOf("month");
    const endOfMonth = today.clone().endOf("month");

    // Supprimer les plannings des mois précédents (garder seulement le mois actuel et le mois suivant)
    const previousMonth = moment().subtract(1, 'months').format('YYYY-MM');
    const deleteResult = await CenterSchedule.deleteMany({
      centerId,
      month: { $lt: previousMonth }
    });

    // Générer les jours pour le mois en cours
    const days = [];

    for (let date = startOfMonth.clone(); date.isSameOrBefore(endOfMonth); date.add(1, "day")) {
      const day = date.day(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
      let capacity = 0;
      let openingTime = "";
      let closingTime = "";

      if (day >= 1 && day <= 4) { // Lundi → Jeudi
        capacity = 48;
        openingTime = "08:00";
        closingTime = "16:00";
      } else if (day === 5) { // Vendredi
        capacity = 30;
        openingTime = "08:00";
        closingTime = "13:00";
      } else if (day === 6) { // Samedi
        capacity = 18;
        openingTime = "09:00";
        closingTime = "12:00";
      } else {
        capacity = 0; // Dimanche (pas de rendez-vous)
        openingTime = "00:00"; // Valeurs par défaut pour passer la validation
        closingTime = "00:00"; // Valeurs par défaut pour passer la validation
      }

      days.push({
        date: date.format("YYYY-MM-DD"),
        capacity,
        openingTime,
        closingTime,
        reservedSlots: 0,
        reservedSlotsDetails: []
      });
    }


    // Chercher si un document pour ce mois et ce centre existe déjà
    let centerSchedule = await CenterSchedule.findOne({
      centerId,
      month: currentMonth
    });

    if (centerSchedule) {
      // Mettre à jour le document existant en préservant les réservations
      for (const newDay of days) {
        const existingDay = centerSchedule.days.find(d => d.date === newDay.date);
        if (existingDay) {
          // Préserver les réservations existantes
          newDay.reservedSlots = existingDay.reservedSlots;
          newDay.reservedSlotsDetails = existingDay.reservedSlotsDetails;
        }
      }
      centerSchedule.days = days;
      await centerSchedule.save();
    } else {
      // Créer un nouveau document
      centerSchedule = new CenterSchedule({
        centerId,
        month: currentMonth,
        slotDuration: 10,
        days
      });
      await centerSchedule.save();
    }

    return true;
  } catch (error) {
    console.error(`❌ Erreur dans createOrUpdateCenterSchedule: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    throw error;
  }
};

module.exports = createOrUpdateCenterSchedule;
