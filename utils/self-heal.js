const { exec } = require('child_process');
const config = require('../config');

let isHealthy = true;
let checkInterval;

function init() {
  if (!config.selfHeal.enabled) {
    console.log('Self-healing is disabled');
    return;
  }
  
  console.log('Initializing self-healing system');
  
  // Start health checks
  checkInterval = setInterval(checkHealth, config.selfHeal.checkInterval);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', handleCrash);
  process.on('unhandledRejection', handleCrash);
}

function checkHealth() {
  // Here you can add more sophisticated health checks
  // For example, checking if critical services are responding
  
  // For now, we'll just use our isHealthy flag
  if (!isHealthy) {
    console.log('System detected as unhealthy, attempting restart...');
    restartApplication();
  }
}

function handleCrash(error) {
  console.error('Critical error detected:', error);
  isHealthy = false;
  restartApplication();
}

function restartApplication() {
  console.log('Restarting application...');
  
  // In a production environment, you might want to use PM2 or similar
  // For this example, we'll just restart the Node process
  exec('npm start', (error, stdout, stderr) => {
    if (error) {
      console.error(`Restart failed: ${error}`);
      return;
    }
    console.log('Application restarted successfully');
  });
}

module.exports = {
  init,
  setHealthStatus: (status) => { isHealthy = status; }
};