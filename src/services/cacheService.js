class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); 
    this.defaultTTL = 300000; 
    
    setInterval(() => this.cleanup(), 60000);
  }

 
  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttl);
    return true;
  }

 
  get(key) {
    const expiresAt = this.ttl.get(key);
    
    if (!expiresAt || Date.now() > expiresAt) {
      this.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

 
  has(key) {
    const expiresAt = this.ttl.get(key);
    
    if (!expiresAt || Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    
    return this.cache.has(key);
  }


  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    return true;
  }


  clear() {
    this.cache.clear();
    this.ttl.clear();
    return true;
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, expiresAt] of this.ttl.entries()) {
      if (now > expiresAt) {
        this.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  
  estimateMemoryUsage() {
    let size = 0;
    for (const [key, value] of this.cache.entries()) {
      size += JSON.stringify(key).length + JSON.stringify(value).length;
    }
    return `${Math.round(size / 1024)} KB`;
  }
}

module.exports = new CacheService();

