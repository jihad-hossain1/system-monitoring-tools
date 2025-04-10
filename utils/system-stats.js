const si = require('systeminformation');
const os = require('os');

async function getStats() {
  try {
    // Get CPU details
    const cpuData = await si.currentLoad();
    const cpuTemp = await si.cpuTemperature();
    const cpuCores = await si.currentLoad().then(data => data.cpus);
    
    // Get memory usage
    const memData = await si.mem();
    
    // Get disk usage and IO
    const fsData = await si.fsSize();
    const diskIO = await si.disksIO() || { rIO_sec: 0, wIO_sec: 0, tIO_sec: 0 };
    
    // Get network stats
    const networkStats = await si.networkStats();
    const networkConnections = await si.networkConnections();
    
    // Get process info
    const processes = await si.processes();
    
    // Get system uptime and load
    const uptime = os.uptime();
    const loadAvg = os.loadavg();
    
    // Calculate average disk usage across all drives
    const totalSize = fsData.reduce((acc, drive) => acc + drive.size, 0);
    const totalUsed = fsData.reduce((acc, drive) => acc + drive.used, 0);
    const diskUsagePercent = (totalUsed / totalSize) * 100;
    
    // Format network speed
    const networkSpeed = networkStats.reduce((acc, net) => {
      return {
        rx_sec: acc.rx_sec + net.rx_sec,
        tx_sec: acc.tx_sec + net.tx_sec,
        rx_bytes: acc.rx_bytes + net.rx_bytes,
        tx_bytes: acc.tx_bytes + net.tx_bytes
      };
    }, { rx_sec: 0, tx_sec: 0, rx_bytes: 0, tx_bytes: 0 });
    
    // Get top processes by CPU and memory
    const topCpuProcesses = [...processes.list]
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 5);
      
    const topMemProcesses = [...processes.list]
      .sort((a, b) => b.mem - a.mem)
      .slice(0, 5);
    
    // Find zombie processes
    const zombieProcesses = processes.list.filter(p => p.state === 'zombie');
    
    return {
      // CPU metrics
      cpuUsage: cpuData.currentLoad.toFixed(2),
      cpuCores: cpuCores.map(core => ({
        load: core.load.toFixed(2)
      })),
      loadAverage: {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2)
      },
      cpuTemperature: cpuTemp.main ? cpuTemp.main.toFixed(2) : 'N/A',
      
      // Memory metrics
      memoryUsage: ((memData.used / memData.total) * 100).toFixed(2),
      memoryDetails: {
        total: formatBytes(memData.total),
        used: formatBytes(memData.used),
        free: formatBytes(memData.free),
        cached: formatBytes(memData.cached),
        swapTotal: formatBytes(memData.swaptotal),
        swapUsed: formatBytes(memData.swapused),
        swapUsagePercent: memData.swaptotal ? ((memData.swapused / memData.swaptotal) * 100).toFixed(2) : '0'
      },
      
      // Disk metrics
      diskUsage: diskUsagePercent.toFixed(2),
      diskDetails: fsData.map(drive => ({
        fs: drive.fs,
        type: drive.type,
        mount: drive.mount,
        size: formatBytes(drive.size),
        used: formatBytes(drive.used),
        usedPercent: drive.use.toFixed(2)
      })),
      diskIO: {
        readSpeed: formatBytes(diskIO?.rIO_sec || 0) + '/s',
        writeSpeed: formatBytes(diskIO?.wIO_sec || 0) + '/s',
        iops: (diskIO?.tIO_sec || 0).toFixed(2)
      },
      
      // Network metrics
      network: {
        uploadSpeed: formatBytes(networkSpeed.tx_sec) + '/s',
        downloadSpeed: formatBytes(networkSpeed.rx_sec) + '/s',
        totalUploaded: formatBytes(networkSpeed.tx_bytes),
        totalDownloaded: formatBytes(networkSpeed.rx_bytes),
        connections: networkConnections.length
      },
      
      // Process metrics
      processes: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping,
        topCpu: topCpuProcesses.map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: p.cpu.toFixed(2),
          mem: p.mem.toFixed(2)
        })),
        topMemory: topMemProcesses.map(p => ({
          pid: p.pid,
          name: p.name,
          cpu: p.cpu.toFixed(2),
          mem: p.mem.toFixed(2)
        })),
        zombies: zombieProcesses.length
      },
      
      // System metrics
      system: {
        uptime: formatUptime(uptime),
        uptimeSeconds: uptime
      },
      
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system stats:', (error)?.message);
    throw error?.message;
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Function to kill a process by PID
async function killProcess(pid) {
  try {
    process.kill(pid);
    return { success: true, message: `Process ${pid} killed successfully` };
  } catch (error) {
    return { success: false, message: `Failed to kill process ${pid}: ${error.message}` };
  }
}

module.exports = {
  getStats,
  killProcess
};