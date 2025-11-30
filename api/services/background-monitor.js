/**
 * 🔄 Background Monitor Service
 *
 * Monitors workflows and generates alerts in background
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

const alertDetector = require('./alert-detector');

let monitoringInterval = null;

/**
 * Start background monitoring
 * @param {number} intervalMinutes - Check interval in minutes (default: 5)
 */
function startMonitoring(intervalMinutes = 5) {
  if (monitoringInterval) {
    console.log('Background monitoring already running');
    return;
  }

  console.log(`Starting background monitoring (every ${intervalMinutes} minutes)`);

  // Run immediately
  runMonitoringCycle();

  // Then run on interval
  monitoringInterval = setInterval(() => {
    runMonitoringCycle();
  }, intervalMinutes * 60 * 1000);
}

/**
 * Stop background monitoring
 */
function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('Background monitoring stopped');
  }
}

/**
 * Run one monitoring cycle
 */
async function runMonitoringCycle() {
  try {
    console.log('Running monitoring cycle...');
    const alerts = await alertDetector.runDetection();
    console.log(`Detected ${alerts.length} alert(s)`);
  } catch (error) {
    console.error('Error in monitoring cycle:', error);
  }
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  runMonitoringCycle
};

