// Chart configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: value => `${value}%`
      }
    }
  },
  animation: {
    duration: 500
  },
  plugins: {
    legend: {
      display: true
    }
  }
};

// Initialize charts
const cpuChart = new Chart(document.getElementById('cpuChart'), {
  type: 'bar',
  data: {
    labels: ['CPU'],
    datasets: [{
      label: 'Usage',
      data: [0],
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 1
    }]
  },
  options: chartOptions
});

const memoryChart = new Chart(document.getElementById('memoryChart'), {
  type: 'bar',
  data: {
    labels: ['Memory'],
    datasets: [{
      label: 'Usage',
      data: [0],
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 1
    }]
  },
  options: chartOptions
});

const swapChart = new Chart(document.getElementById('swapChart'), {
  type: 'bar',
  data: {
    labels: ['Swap'],
    datasets: [{
      label: 'Usage',
      data: [0],
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      borderColor: 'rgb(153, 102, 255)',
      borderWidth: 1
    }]
  },
  options: chartOptions
});

const diskChart = new Chart(document.getElementById('diskChart'), {
  type: 'bar',
  data: {
    labels: ['Disk'],
    datasets: [{
      label: 'Usage',
      data: [0],
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1
    }]
  },
  options: chartOptions
});

const networkChart = new Chart(document.getElementById('networkChart'), {
  type: 'line',
  data: {
    labels: Array(60).fill(''),
    datasets: [
      {
        label: 'Download',
        data: Array(60).fill(0),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Upload',
        data: Array(60).fill(0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => formatBytes(value, 0) + '/s'
        }
      }
    },
    animation: {
      duration: 500
    }
  }
});

const historyChart = new Chart(document.getElementById('historyChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'CPU',
        data: [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Memory',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: false,
        tension: 0.4
      },
      {
        label: 'Disk',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: false,
        tension: 0.4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: value => `${value}%`
        }
      }
    },
    animation: {
      duration: 500
    }
  }
});

// Network data for the chart
const networkData = {
  download: Array(60).fill(0),
  upload: Array(60).fill(0)
};

// Elements for updating values
const cpuValue = document.getElementById('cpuValue');
const memoryValue = document.getElementById('memoryValue');
const diskValue = document.getElementById('diskValue');
const lastUpdated = document.getElementById('lastUpdated');
const connectionStatus = document.getElementById('connectionStatus');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
}

// Export buttons
document.getElementById('exportJSON').addEventListener('click', () => {
  window.location.href = '/api/export?format=json';
});

document.getElementById('exportCSV').addEventListener('click', () => {
  window.location.href = '/api/export?format=csv';
});

// History time range buttons
document.getElementById('historyHour').addEventListener('click', () => {
  fetchHistory('hour');
});

document.getElementById('historyDay').addEventListener('click', () => {
  fetchHistory('day');
});

document.getElementById('historyWeek').addEventListener('click', () => {
  fetchHistory('week');
});

// Settings save button
document.getElementById('saveSettings').addEventListener('click', saveSettings);

// Connect to SSE endpoint
function connectToEventSource() {
  const eventSource = new EventSource('/events');
  
  eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    updateDashboard(data);
  };
  
  eventSource.onerror = function() {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.className = 'disconnected';
    
    // Try to reconnect after 5 seconds
    setTimeout(() => {
      eventSource.close();
      connectToEventSource();
    }, 5000);
  };
  
  eventSource.onopen = function() {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'connected';
  };
}

// Update dashboard with new data
function updateDashboard(data) {
  // Update CPU section
  updateCpuSection(data);
  
  // Update Memory section
  updateMemorySection(data);
  
  // Update Disk section
  updateDiskSection(data);
  
  // Update Network section
  updateNetworkSection(data);
  
  // Update Process section
  updateProcessSection(data);
  
  // Update System section
  updateSystemSection(data);
  
  // Update timestamp
  const timestamp = new Date(data.timestamp);
  lastUpdated.textContent = `Last updated: ${timestamp.toLocaleTimeString()}`;
}

// Update CPU section
function updateCpuSection(data) {
  // Update chart
  cpuChart.data.datasets[0].data = [data.cpuUsage];
  cpuChart.update();
  
  // Update value display
  cpuValue.textContent = `${data.cpuUsage}%`;
  updateValueColor(cpuValue, data.cpuUsage);
  
  // Update CPU cores
  const coresContainer = document.getElementById('cpuCores');
  coresContainer.innerHTML = '';
  
  data.cpuCores.forEach((core, index) => {
    const coreItem = document.createElement('div');
    coreItem.className = 'core-item';
    
    const coreLabel = document.createElement('span');
    coreLabel.className = 'core-label';
    coreLabel.textContent = `Core ${index + 1}`;
    
    const coreValue = document.createElement('span');
    coreValue.className = 'core-value';
    coreValue.textContent = `${core.load}%`;
    updateValueColor(coreValue, core.load);
    
    coreItem.appendChild(coreLabel);
    coreItem.appendChild(coreValue);
    coresContainer.appendChild(coreItem);
  });
  
  // Update load average
  document.getElementById('load1').textContent = data.loadAverage['1min'];
  document.getElementById('load5').textContent = data.loadAverage['5min'];
  document.getElementById('load15').textContent = data.loadAverage['15min'];
  
  // Update temperature
  document.getElementById('cpuTemp').textContent = data.cpuTemperature === 'N/A' ? 
    'N/A' : `${data.cpuTemperature}°C`;
}

// Update Memory section
function updateMemorySection(data) {
  // Update chart
  memoryChart.data.datasets[0].data = [data.memoryUsage];
  memoryChart.update();
  
  // Update swap chart
  swapChart.data.datasets[0].data = [data.memoryDetails.swapUsagePercent];
  swapChart.update();
  
  // Update value display
  memoryValue.textContent = `${data.memoryUsage}%`;
  updateValueColor(memoryValue, data.memoryUsage);
  
  // Update memory details
  document.getElementById('memTotal').textContent = data.memoryDetails.total;
  document.getElementById('memUsed').textContent = data.memoryDetails.used;
  document.getElementById('memFree').textContent = data.memoryDetails.free;
  document.getElementById('memCached').textContent = data.memoryDetails.cached;
  
  // Update swap details
  document.getElementById('swapTotal').textContent = data.memoryDetails.swapTotal;
  document.getElementById('swapUsed').textContent = data.memoryDetails.swapUsed;
}

// Update Disk section
function updateDiskSection(data) {
  // Update chart
  diskChart.data.datasets[0].data = [data.diskUsage];
  diskChart.update();
  
  // Update value display
  diskValue.textContent = `${data.diskUsage}%`;
  updateValueColor(diskValue, data.diskUsage);
  
  // Update partitions
  const partitionsContainer = document.getElementById('diskPartitions');
  partitionsContainer.innerHTML = '';
  
  data.diskDetails.forEach(drive => {
    const partitionItem = document.createElement('div');
    partitionItem.className = 'partition-item';
    
    const partitionHeader = document.createElement('div');
    partitionHeader.className = 'partition-header';
    
    const partitionName = document.createElement('span');
    partitionName.className = 'partition-name';
    partitionName.textContent = `${drive.mount} (${drive.type})`;
    
    const partitionUsage = document.createElement('span');
    partitionUsage.className = 'partition-usage';
    partitionUsage.textContent = `${drive.usedPercent}% (${drive.used} / ${drive.size})`;
    
    partitionHeader.appendChild(partitionName);
    partitionHeader.appendChild(partitionUsage);
    
    const partitionBar = document.createElement('div');
    partitionBar.className = 'partition-bar';
    
    const partitionFill = document.createElement('div');
    partitionFill.className = 'partition-fill';
    partitionFill.style.width = `${drive.usedPercent}%`;
    
    if (drive.usedPercent > 90) {
      partitionFill.classList.add('danger');
    } else if (drive.usedPercent > 70) {
      partitionFill.classList.add('warning');
    }
    
    partitionBar.appendChild(partitionFill);
    
    partitionItem.appendChild(partitionHeader);
    partitionItem.appendChild(partitionBar);
    partitionsContainer.appendChild(partitionItem);
  });
  
  // Update I/O stats
  document.getElementById('diskRead').textContent = data.diskIO.readSpeed;
  document.getElementById('diskWrite').textContent = data.diskIO.writeSpeed;
  document.getElementById('diskIOPS').textContent = data.diskIO.iops;
}

// Update Network section
function updateNetworkSection(data) {
  // Update network speed values
  document.getElementById('networkDown').textContent = data.network.downloadSpeed;
  document.getElementById('networkUp').textContent = data.network.uploadSpeed;
  
  // Update total transfer
  document.getElementById('totalDown').textContent = data.network.totalDownloaded;
  document.getElementById('totalUp').textContent = data.network.totalUploaded;
  
  // Update connections
  document.getElementById('networkConnections').textContent = 
    `${data.network.connections} active connections`;
  
  // Update chart data
  // Parse the speed values to get numeric values for the chart
  const downloadSpeed = parseSpeedValue(data.network.downloadSpeed);
  const uploadSpeed = parseSpeedValue(data.network.uploadSpeed);
  
  // Shift the arrays and add new data
  networkData.download.shift();
  networkData.download.push(downloadSpeed);
  
  networkData.upload.shift();
  networkData.upload.push(uploadSpeed);
  
  // Update the chart
  networkChart.data.datasets[0].data = networkData.download;
  networkChart.data.datasets[1].data = networkData.upload;
  networkChart.update();
}

// Update Process section
function updateProcessSection(data) {
  // Update process counts
  document.getElementById('processTotal').textContent = data.processes.all;
  document.getElementById('processRunning').textContent = data.processes.running;
  document.getElementById('processSleeping').textContent = data.processes.sleeping;
  document.getElementById('processZombie').textContent = data.processes.zombies;
  
  // Update top CPU processes
  updateProcessTable('topCpuTable', data.processes.topCpu);
  
  // Update top memory processes
  updateProcessTable('topMemTable', data.processes.topMemory);
}

// Update System section
function updateSystemSection(data) {
  // Update uptime
  document.getElementById('systemUptime').textContent = data.system.uptime;
}

// Helper function to update process tables
function updateProcessTable(tableId, processes) {
  const tableBody = document.getElementById(tableId).querySelector('tbody');
  tableBody.innerHTML = '';
  
  processes.forEach(process => {
    const row = document.createElement('tr');
    
    const pidCell = document.createElement('td');
    pidCell.textContent = process.pid;
    
    const nameCell = document.createElement('td');
    nameCell.textContent = process.name;
    
    const cpuCell = document.createElement('td');
    cpuCell.textContent = `${process.cpu}%`;
    
    const memCell = document.createElement('td');
    memCell.textContent = `${process.mem}%`;
    
    const actionCell = document.createElement('td');
    const killButton = document.createElement('button');
    killButton.className = 'kill-button';
    killButton.textContent = 'Kill';
    killButton.addEventListener('click', () => killProcess(process.pid));
    actionCell.appendChild(killButton);
    
    row.appendChild(pidCell);
    row.appendChild(nameCell);
    row.appendChild(cpuCell);
    row.appendChild(memCell);
    row.appendChild(actionCell);
    
    tableBody.appendChild(row);
  });
}

// Function to kill a process
async function killProcess(pid) {
  if (!confirm(`Are you sure you want to kill process ${pid}?`)) {
    return;
  }
  
  try {
    const response = await fetch('/api/process/kill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ pid })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Process ${pid} killed successfully`);
    } else {
      alert(`Failed to kill process: ${result.message}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

// Function to save settings
async function saveSettings() {
  const cpuThreshold = document.getElementById('cpuThreshold').value;
  const memoryThreshold = document.getElementById('memoryThreshold').value;
  const diskThreshold = document.getElementById('diskThreshold').value;
  const emailTo = document.getElementById('emailTo').value;
  const selfHealEnabled = document.getElementById('selfHealEnabled').checked;
  
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cpuThreshold: parseInt(cpuThreshold),
        memoryThreshold: parseInt(memoryThreshold),
        diskThreshold: parseInt(diskThreshold),
        emailConfig: {
          to: emailTo
        },
        selfHealConfig: {
          enabled: selfHealEnabled
        }
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('Settings saved successfully');
    } else {
      alert('Failed to save settings');
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

// Function to fetch historical data
async function fetchHistory(timeRange) {
  try {
    const response = await fetch('/api/history');
    const data = await response.json();
    
    let filteredData;
    let labels;
    
    if (timeRange === 'hour') {
      // Get last 60 data points (1 hour if 1 point per minute)
      filteredData = {
        cpu: data.cpu.slice(-60),
        memory: data.memory.slice(-60),
        disk: data.disk.slice(-60),
        timestamp: data.timestamp.slice(-60)
      };
    } else if (timeRange === 'day') {
      // Get last 1440 data points (24 hours if 1 point per minute)
      filteredData = {
        cpu: data.cpu.slice(-1440),
        memory: data.memory.slice(-1440),
        disk: data.disk.slice(-1440),
        timestamp: data.timestamp.slice(-1440)
      };
    } else if (timeRange === 'week') {
      // Get all data points (up to 7 days)
      filteredData = data;
    }
    
    // Format timestamps for display
    labels = filteredData.timestamp.map(ts => {
      const date = new Date(ts);
      return date.toLocaleTimeString();
    });
    
    // Update history chart
    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = filteredData.cpu;
    historyChart.data.datasets[1].data = filteredData.memory;
    historyChart.data.datasets[2].data = filteredData.disk;
    historyChart.update();
    
  } catch (error) {
    console.error('Error fetching history:', error);
  }
}

// Helper function to update value color based on percentage
function updateValueColor(element, value) {
  if (value > 90) {
    element.className = element.className.replace(/text-\w+/g, '') + ' text-danger';
  } else if (value > 70) {
    element.className = element.className.replace(/text-\w+/g, '') + ' text-warning';
  } else {
    element.className = element.className.replace(/text-\w+/g, '') + ' text-success';
  }
}

// Helper function to parse speed values from strings like "10.5 MB/s"
function parseSpeedValue(speedString) {
  const parts = speedString.split(' ');
  if (parts.length !== 2) return 0;
  
  const value = parseFloat(parts[0]);
  const unit = parts[1].toLowerCase();
  
  if (unit.startsWith('b/')) return value;
  if (unit.startsWith('kb/')) return value * 1024;
  if (unit.startsWith('mb/')) return value * 1024 * 1024;
  if (unit.startsWith('gb/')) return value * 1024 * 1024 * 1024;
  
  return value;
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Start the dashboard
document.addEventListener('DOMContentLoaded', () => {
  connectToEventSource();
  fetchHistory('hour'); // Load last hour of data by default
});