const nodemailer = require('nodemailer');
const config = require('../config');

// Track when alerts were last sent to prevent spam
const alertTracker = {
  lastAlertTime: null,
  // Only send an alert once per hour
  cooldownPeriod: 60 * 60 * 1000 
};

function createTransporter() {
  return nodemailer.createTransport({
    service: config.email.service,
    auth: config.email.auth
  });
}

async function sendAlert({ subject, message }) {
  // Check if we're still in cooldown period
  const now = Date.now();
  if (alertTracker.lastAlertTime && 
      (now - alertTracker.lastAlertTime) < alertTracker.cooldownPeriod) {
    console.log('Alert cooldown period active, skipping email');
    return;
  }
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: config.email.from,
      to: config.email.to,
      subject: subject,
      text: message,
      html: `<p>${message}</p>`
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Alert email sent successfully');
    
    // Update last alert time
    alertTracker.lastAlertTime = now;
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
}

module.exports = {
  sendAlert
};