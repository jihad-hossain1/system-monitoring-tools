const express = require('express');
const path = require('path');
const systemStats = require('./utils/system-stats');
const mailer = require('./utils/mailer');
const selfHeal = require('./utils/self-heal');
const config = require('./config');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Store historical data
const historyData = {
  cpu: [],
  memory: [],
  disk: [],
  network: [],
  timestamp: []
};

// Maximum history points to keep
const MAX_HISTORY_POINTS = 1440; // 24 hours at 1 point per minute

// SSE endpoint for real-time system stats
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial data
  sendStats(res);
  
  // Send stats every second
  const intervalId = setInterval(() => {
    sendStats(res);
  }, 1000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

// Endpoint to get historical data
app.get('/api/history', (req, res) => {
  res.json(historyData);
});

// Endpoint to export logs
app.get('/api/export', (req, res) => {
  const format = req.query.format || 'json';
  
  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename=system-stats.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(historyData);
  } else if (format === 'csv') {
    res.setHeader('Content-Disposition', 'attachment; filename=system-stats.csv');
    res.setHeader('Content-Type', 'text/csv');
    
    // Create CSV header
    let csv = 'timestamp,cpuUsage,memoryUsage,diskUsage,networkUpload,networkDownload\n';
    
    // Add data rows
    for (let i = 0; i < historyData.timestamp.length; i++) {
      csv += `${historyData.timestamp[i]},${historyData.cpu[i]},${historyData.memory[i]},${historyData.disk[i]},${historyData.network[i]?.upload || 0},${historyData.network[i]?.download || 0}\n`;
    }
    
    res.send(csv);
  } else {
    res.status(400).json({ error: 'Unsupported format. Use "json" or "csv".' });
  }
});

// Endpoint to kill a process
app.post('/api/process/kill', async (req, res) => {
  const { pid } = req.body;
  
  if (!pid) {
    return res.status(400).json({ error: 'PID is required' });
  }
  
  try {
    const result = await systemStats.killProcess(pid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update configuration
app.post('/api/config', (req, res) => {
  const { diskThreshold, emailConfig, selfHealConfig } = req.body;
  
  if (diskThreshold !== undefined) {
    config.diskThreshold = diskThreshold;
  }
  
  if (emailConfig) {
    config.email = { ...config.email, ...emailConfig };
  }
  
  if (selfHealConfig) {
    config.selfHeal = { ...config.selfHeal, ...selfHealConfig };
  }
  
  res.json({ success: true, config });
});

async function sendStats(res) {
  try {
    const stats = await systemStats.getStats();
    
    // Check if disk usage exceeds threshold
    const criticalDrives = stats.diskDetails.filter(drive => 
      parseFloat(drive.usedPercent) > config.diskThreshold
    );
    
    if (criticalDrives.length > 0) {
      mailer.sendAlert({
        subject: 'High Disk Usage Alert',
        message: `The following drives have exceeded the ${config.diskThreshold}% threshold:\n\n${
          criticalDrives.map(drive => 
            `${drive.mount}: ${drive.usedPercent}% (${drive.used} / ${drive.size})`
          ).join('\n')
        }`
      });
    }
    
    // Store data for history (once per minute)
    const now = new Date();
    if (now.getSeconds() === 0 || historyData.timestamp.length === 0) {
      historyData.timestamp.push(stats.timestamp);
      historyData.cpu.push(stats.cpuUsage);
      historyData.memory.push(stats.memoryUsage);
      historyData.disk.push(stats.diskUsage);
      historyData.network.push({
        upload: stats.network.uploadSpeed,
        download: stats.network.downloadSpeed
      });
      
      // Limit history size
      if (historyData.timestamp.length > MAX_HISTORY_POINTS) {
        historyData.timestamp.shift();
        historyData.cpu.shift();
        historyData.memory.shift();
        historyData.disk.shift();
        historyData.network.shift();
      }
    }
    
    res.write(`data: ${JSON.stringify(stats)}\n\n`);
  } catch (error) {
    console.error('Error sending stats:', error);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Initialize self-healing
  selfHeal.init();
});