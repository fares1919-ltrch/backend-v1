const cron = require('node-cron');
const db = require('../models');
const Center = db.center;
const createOrUpdateCenterSchedule = require('./centerSchedule');

/**
 * Configure toutes les tâches planifiées de l'application
 */
const setupScheduledTasks = () => {
  console.log('🔄 Configuration des tâches planifiées...');

  // Tâche pour la mise à jour mensuelle des plannings de centres
  // S'exécute le 1er jour de chaque mois à 00:05
  cron.schedule('5 0 1 * *', async () => {
    try {
      console.log('📅 TÂCHE PLANIFIÉE: Début de la mise à jour mensuelle des plannings de centres');
      const centers = await Center.find({ status: 'active' });
      
      console.log(`🔍 ${centers.length} centres actifs trouvés pour la mise à jour`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const center of centers) {
        try {
          console.log(`⏳ Mise à jour du planning pour le centre: ${center.name} (${center._id})`);
          await createOrUpdateCenterSchedule(center._id);
          successCount++;
        } catch (centerError) {
          console.error(`❌ Erreur lors de la mise à jour du centre ${center._id}:`, centerError.message);
          errorCount++;
        }
      }
      
      console.log(`✅ Mise à jour mensuelle terminée: ${successCount} réussies, ${errorCount} échecs`);
    } catch (err) {
      console.error('❌ ERREUR CRITIQUE lors de la mise à jour mensuelle des plannings:', err);
    }
  });

  // Exécuter la synchronisation au démarrage pour s'assurer que tout est à jour
  setTimeout(async () => {
    try {
      console.log('🔄 Exécution de la synchronisation initiale des plannings de centres...');
      const centers = await Center.find({ status: 'active' });
      
      console.log(`🔍 ${centers.length} centres actifs trouvés`);
      
      for (const center of centers) {
        try {
          await createOrUpdateCenterSchedule(center._id);
          console.log(`✅ Planning synchronisé pour: ${center.name}`);
        } catch (error) {
          console.error(`❌ Erreur pour le centre ${center.name}:`, error.message);
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors de la synchronisation initiale:', err);
    }
  }, 5000);

  console.log('✅ Tâches planifiées configurées avec succès');
};

module.exports = setupScheduledTasks; 