const cron = require('node-cron');
const db = require('../models');
const Center = db.center;
const createOrUpdateCenterSchedule = require('./centerSchedule');

/**
 * Configure toutes les tâches planifiées de l'application
 */
const setupScheduledTasks = () => {

  // Tâche pour la mise à jour mensuelle des plannings de centres
  // S'exécute le 1er jour de chaque mois à 00:05
  cron.schedule('5 0 1 * *', async () => {
    try {
      const centers = await Center.find({ status: 'active' });      
      let successCount = 0;
      let errorCount = 0;
      
      for (const center of centers) {
        try {
          await createOrUpdateCenterSchedule(center._id);
          successCount++;
        } catch (centerError) {
          console.error(`❌ Erreur lors de la mise à jour du centre ${center._id}:`, centerError.message);
          errorCount++;
        }
      }
      
    } catch (err) {
      console.error('❌ ERREUR CRITIQUE lors de la mise à jour mensuelle des plannings:', err);
    }
  });

  // Exécuter la synchronisation au démarrage pour s'assurer que tout est à jour
  setTimeout(async () => {
    try {
      const centers = await Center.find({ status: 'active' });
      for (const center of centers) {
        try {
          await createOrUpdateCenterSchedule(center._id);
        } catch (error) {
          console.error(`❌ Erreur pour le centre ${center.name}:`, error.message);
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors de la synchronisation initiale:', err);
    }
  }, 5000);

};

module.exports = setupScheduledTasks; 