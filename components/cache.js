class CacheManager {
  constructor(ttl = 5 * 60 * 1000) { // TTL default: 5 minutos
    this.cache = new Map();
    this.ttl = ttl;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Limpieza cada minuto
  }

  set(key, value, customTtl = null) {
    const expiry = customTtl ? Date.now() + customTtl : Date.now() + this.ttl;
    this.cache.set(key, {
      value,
      expiry,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Método para obtener estadísticas del caché
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      total: this.cache.size,
      valid: validItems,
      expired: expiredItems
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Crear instancia global del caché
const cache = new CacheManager();

// Decorator para cachear resultados de funciones asíncronas
function cacheResult(keyPrefix, ttl = null) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // Intentar obtener del caché
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`Cache hit for ${cacheKey}`);
        return cachedResult;
      }

      // Ejecutar método original
      console.log(`Cache miss for ${cacheKey}`);
      const result = await method.apply(this, args);
      
      // Guardar en caché
      cache.set(cacheKey, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

module.exports = {
  cache,
  cacheResult,
  CacheManager
};
