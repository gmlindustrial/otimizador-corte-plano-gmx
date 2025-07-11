interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface LogEntry {
  level: keyof LogLevel
  message: string
  context?: string
  timestamp: string
  userId?: string
  data?: any
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: string
  context?: string
}

export class MonitoringService {
  private static instance: MonitoringService
  private logs: LogEntry[] = []
  private metrics: PerformanceMetric[] = []
  private maxLogs = 1000
  private maxMetrics = 500

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  log(level: keyof LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      data
    }

    this.logs.push(entry)
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const logMethod = console[level] || console.log
      logMethod(`[${entry.timestamp}] ${context || 'APP'}: ${message}`, data || '')
    }

    // Send critical errors to external service in production
    if (level === 'ERROR' && import.meta.env.PROD) {
      this.sendToExternalService(entry)
    }
  }

  error(message: string, context?: string, data?: any): void {
    this.log('ERROR', message, context, data)
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('WARN', message, context, data)
  }

  info(message: string, context?: string, data?: any): void {
    this.log('INFO', message, context, data)
  }

  debug(message: string, context?: string, data?: any): void {
    this.log('DEBUG', message, context, data)
  }

  recordMetric(name: string, value: number, unit: string, context?: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context
    }

    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  measurePerformance<T>(
    name: string, 
    fn: () => T | Promise<T>, 
    context?: string
  ): T | Promise<T> {
    const start = performance.now()
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.then(res => {
          this.recordMetric(name, performance.now() - start, 'ms', context)
          return res
        }).catch(err => {
          this.recordMetric(name, performance.now() - start, 'ms', context)
          this.error(`Performance measurement failed for ${name}`, context, err)
          throw err
        })
      } else {
        this.recordMetric(name, performance.now() - start, 'ms', context)
        return result
      }
    } catch (error) {
      this.recordMetric(name, performance.now() - start, 'ms', context)
      this.error(`Performance measurement failed for ${name}`, context, error)
      throw error
    }
  }

  getRecentLogs(level?: keyof LogLevel, limit = 100): LogEntry[] {
    let filtered = this.logs
    if (level) {
      filtered = this.logs.filter(log => log.level === level)
    }
    return filtered.slice(-limit)
  }

  getMetrics(name?: string, limit = 100): PerformanceMetric[] {
    let filtered = this.metrics
    if (name) {
      filtered = this.metrics.filter(metric => metric.name === name)
    }
    return filtered.slice(-limit)
  }

  getSystemHealth(): {
    totalLogs: number
    errorCount: number
    recentErrors: LogEntry[]
    averagePerformance: Record<string, number>
  } {
    const errorLogs = this.logs.filter(log => log.level === 'ERROR')
    const recentErrors = errorLogs.slice(-10)
    
    // Calculate average performance for common operations
    const performanceGroups = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = []
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    const averagePerformance = Object.entries(performanceGroups).reduce((acc, [name, values]) => {
      acc[name] = values.reduce((sum, val) => sum + val, 0) / values.length
      return acc
    }, {} as Record<string, number>)

    return {
      totalLogs: this.logs.length,
      errorCount: errorLogs.length,
      recentErrors,
      averagePerformance
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Could be Sentry, LogRocket, or custom endpoint
    console.error('Critical error logged:', entry)
  }

  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      metrics: this.metrics,
      exported: new Date().toISOString()
    }, null, 2)
  }
}

// Enhanced ErrorHandler with monitoring
export class EnhancedErrorHandler {
  private static monitoring = MonitoringService.getInstance()

  static handle(error: any, context: string, additionalData?: any): string {
    const errorMessage = error?.message || 'Erro desconhecido'
    const fullMessage = `${context}: ${errorMessage}`
    
    // Log with monitoring service
    this.monitoring.error(fullMessage, context, {
      error: error?.stack || error,
      additionalData
    })
    
    return fullMessage
  }

  static handleSuccess(message: string, context?: string): void {
    this.monitoring.info(message, context || 'SUCCESS')
  }

  static handlePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>,
    context?: string
  ): T | Promise<T> {
    return this.monitoring.measurePerformance(operation, fn, context)
  }
}
