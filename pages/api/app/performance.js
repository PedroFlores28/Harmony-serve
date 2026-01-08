import monitor from './performance-monitor';

// Endpoint para monitoreo de rendimiento
export default async (req, res) => {
  try {
    const stats = monitor.getStats();
    const health = monitor.getHealthStatus();
    
    res.json({
      status: 'success',
      health,
      performance: stats,
      timestamp: new Date().toISOString(),
      recommendations: getRecommendations(stats, health),
    });
  } catch (error) {
    console.error('Performance endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance stats',
    });
  }
};

function getRecommendations(stats, health) {
  const recommendations = [];
  
  if (health === 'critical') {
    recommendations.push('🚨 CRITICAL: El sistema necesita atención inmediata');
    recommendations.push('Considera reiniciar el servidor');
    recommendations.push('Verifica la conexión a la base de datos');
  }
  
  if (stats.avgResponseTime > 2000) {
    recommendations.push('⚠️ Tiempo de respuesta promedio alto');
    recommendations.push('Considera agregar más índices a la base de datos');
    recommendations.push('Revisa las consultas lentas');
  }
  
  if (stats.slowRequests > 0) {
    const slowRate = (stats.slowRequests / stats.totalRequests) * 100;
    if (slowRate > 10) {
      recommendations.push('🐌 Alta tasa de requests lentos');
      recommendations.push('Optimiza los endpoints más lentos');
      recommendations.push('Considera implementar más caché');
    }
  }
  
  if (stats.errors > 0) {
    const errorRate = (stats.errors / stats.totalRequests) * 100;
    if (errorRate > 5) {
      recommendations.push('❌ Alta tasa de errores');
      recommendations.push('Revisa los logs de errores');
      recommendations.push('Implementa mejor manejo de errores');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ El sistema funciona correctamente');
  }
  
  return recommendations;
}
