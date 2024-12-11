type LogLevel = 'info' | 'warn' | 'error'
type LogSource = 'cache' | 'database' | 'system'

interface LogEntry {
  timestamp: number
  level: LogLevel
  source: LogSource
  message: string
}

const MAX_LOGS = 100 // Keep last 100 logs
const LOGS_KEY = 'workflow_logs'

export const logger = {
  logs: [] as LogEntry[],

  log(level: LogLevel, source: LogSource, message: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      source,
      message
    }

    // Add to memory
    this.logs.unshift(entry)
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop()
    }

    // Save to localStorage
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs))
    } catch (error) {
      
    }

    // Also log to console with appropriate styling
    const styles = {
      cache: 'color: #2563eb', // blue
      database: 'color: #16a34a', // green
      system: 'color: #9333ea', // purple
      info: 'font-weight: normal',
      warn: 'font-weight: bold; color: #ca8a04',
      error: 'font-weight: bold; color: #dc2626'
    }

    console.log(
      `%c[${source.toUpperCase()}] %c${message}`,
      styles[source],
      styles[level]
    )
  },

  getLogs() {
    try {
      const savedLogs = localStorage.getItem(LOGS_KEY)
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs)
      }
    } catch (error) {
      
    }
    return this.logs
  },

  clearLogs() {
    this.logs = []
    try {
      localStorage.removeItem(LOGS_KEY)
    } catch (error) {
      
    }
  }
} 