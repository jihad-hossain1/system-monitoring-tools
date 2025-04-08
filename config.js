module.exports = {
  diskThreshold: 90, // Percentage threshold for disk usage alerts
  cpuThreshold: 90, // Percentage threshold for CPU usage alerts
  memoryThreshold: 90, // Percentage threshold for memory usage alerts
  networkThreshold: 90, // Percentage threshold for network usage alerts
  
  email: {
    from: 'system-monitor@example.com',
    to: 'admin@example.com',
    service: 'gmail', // Change based on your email provider
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  },
  
  selfHeal: {
    enabled: true,
    checkInterval: 5000, // Check system health every 5 seconds
    maxRestarts: 5, // Maximum number of restarts in a given period
    restartPeriod: 3600000 // 1 hour in milliseconds
  },
  
  history: {
    enabled: true,
    retention: 7, // Days to keep historical data
    interval: 60000 // Record data every minute
  },
  
  ui: {
    refreshRate: 1000, // Dashboard refresh rate in milliseconds
    defaultTheme: 'light', // 'light' or 'dark'
    showAllDrives: true, // Show all drives or just the main one
    showAllNetworkInterfaces: false // Show all network interfaces or just the main one
  },
  
  alerts: {
    methods: ['email'], // 'email', 'sms', 'slack'
    cooldown: 3600000, // 1 hour cooldown between similar alerts
    enabledAlerts: {
      cpu: true,
      memory: true,
      disk: true,
      network: false,
      zombieProcess: true
    }
  }
};