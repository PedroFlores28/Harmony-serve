class PerformanceMonitor {
  constructor() {
    this.requests = new Map();
    this.stats = {
      totalRequests: 0,
      slowRequests: 0,
      errors: 0,
      avgResponseTime: 0,
      slowThreshold: 2000, // 2 segundos
    };
    this.slowRequests = [];
    this.maxSlowRequests = 100; // Mantener solo los últimos 100
  }

  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);
      
      // Guardar información del request
      this.requests.set(requestId, {
        method: req.method,
        url: req.url,
        startTime,
        ip: req.ip || req.connection.remoteAddress,
      });

      // Override res.end para medir el tiempo de respuesta
      const originalEnd = res.end;
      res.end = function(...args) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Actualizar estadísticas
        monitor.updateStats(requestId, responseTime, res.statusCode);
        
        // Log de requests lentos
        if (responseTime > monitor.stats.slowThreshold) {
          monitor.logSlowRequest(requestId, responseTime, res.statusCode);
        }
        
        // Llamar al original end
        originalEnd.apply(this, args);
      };

      next();
    };
  }

  updateStats(requestId, responseTime, statusCode) {
    const request = this.requests.get(requestId);
    if (!request) return;

    this.stats.totalRequests++;
    this.stats.avgResponseTime = 
      (this.stats.avgResponseTime * (this.stats.totalRequests - 1) + responseTime) / 
      this.stats.totalRequests;

    if (responseTime > this.stats.slowThreshold) {
      this.stats.slowRequests++;
    }

    if (statusCode >= 400) {
      this.stats.errors++;
    }

    // Limpiar request antiguo
    this.requests.delete(requestId);
  }

  logSlowRequest(requestId, responseTime, statusCode) {
    const request = this.requests.get(requestId);
    if (!request) return;

    const slowRequest = {
      ...request,
      responseTime,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    // Agregar a la lista de requests lentos
    this.slowRequests.push(slowRequest);
    
    // Mantener solo los últimos N requests
    if (this.slowRequests.length > this.maxSlowRequests) {
      this.slowRequests.shift();
    }

    // Log en consola
    console.warn(`🐌 SLOW REQUEST: ${request.method} ${request.url} - ${responseTime}ms - Status: ${statusCode}`);
  }

  getStats() {
    return {
      ...this.stats,
      slowRequests: this.slowRequests.slice(-10), // Últimos 10 requests lentos
      activeConnections: this.requests.size,
    };
  }

  getHealthStatus() {
    const { avgResponseTime, slowRequests, totalRequests, errors } = this.stats;
    
    if (totalRequests === 0) return 'healthy';
    
    const slowRequestRate = (slowRequests / totalRequests) * 100;
    const errorRate = (errors / totalRequests) * 100;
    
    if (avgResponseTime > 5000 || slowRequestRate > 20 || errorRate > 10) {
      return 'critical';
    } else if (avgResponseTime > 2000 || slowRequestRate > 10 || errorRate > 5) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  reset() {
    this.stats = {
      totalRequests: 0,
      slowRequests: 0,
      errors: 0,
      avgResponseTime: 0,
      slowThreshold: 2000,
    };
    this.slowRequests = [];
    this.requests.clear();
  }
}

// Crear instancia global
const monitor = new PerformanceMonitor();

module.exports = monitor;
