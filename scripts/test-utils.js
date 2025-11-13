/**
 * Test Utilities
 * Helper functions for test scripts
 */

const { execSync } = require('child_process')
const net = require('net')

/**
 * Wait for a port to be available
 * @param {string} host - Hostname
 * @param {number} port - Port number
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if port is available
 */
async function waitForPort(host, port, timeout = 30000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket()

        socket.setTimeout(1000)

        socket.on('connect', () => {
          socket.destroy()
          resolve(true)
        })

        socket.on('timeout', () => {
          socket.destroy()
          reject(new Error('timeout'))
        })

        socket.on('error', (err) => {
          socket.destroy()
          reject(err)
        })

        socket.connect(port, host)
      })

      return true
    } catch (error) {
      await sleep(1000)
    }
  }

  return false
}

/**
 * Check if Docker is running
 * @returns {boolean} True if Docker is running
 */
function checkDockerRunning() {
  try {
    execSync('docker ps', { stdio: 'pipe' })
    return true
  } catch (error) {
    return false
  }
}

/**
 * Check if a process is running on a port
 * @param {number} port - Port number
 * @returns {boolean} True if port is in use
 */
function isPortInUse(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' })
      return output.length > 0
    } else {
      const output = execSync(`lsof -i :${port}`, { encoding: 'utf-8' })
      return output.length > 0
    }
  } catch (error) {
    return false
  }
}

/**
 * Kill process on a port
 * @param {number} port - Port number
 */
function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' })
      const lines = output.trim().split('\n')

      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && !isNaN(pid)) {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
        }
      })
    } else {
      execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore' })
    }
  } catch (error) {
    // Port might not be in use
  }
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if a URL is accessible
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if URL is accessible
 */
async function waitForUrl(url, timeout = 30000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return true
      }
    } catch (error) {
      await sleep(1000)
    }
  }

  return false
}

/**
 * Get environment variable or throw error
 * @param {string} name - Environment variable name
 * @returns {string} Environment variable value
 */
function getEnvOrThrow(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

module.exports = {
  waitForPort,
  checkDockerRunning,
  isPortInUse,
  killPort,
  sleep,
  waitForUrl,
  getEnvOrThrow,
}
