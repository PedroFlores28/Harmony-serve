const BaseCollection = require('./base-collection');
const { cache } = require('./cache');

class User extends BaseCollection {
  constructor() {
    super('users');
  }

  async findWithLimit(query, limit = 50, skip = 0) {
    try {
      const collection = await this.getCollection();
      return await collection.find(query).limit(limit).skip(skip).toArray();
    } catch (error) {
      console.error('Error in User.findWithLimit:', error);
      throw error;
    }
  }

  async findByIds(ids, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.find({ id: { $in: ids } }, options).toArray();
    } catch (error) {
      console.error('Error in User.findByIds:', error);
      throw error;
    }
  }

  async findByParentId(parentId, limit = 100) {
    try {
      const collection = await this.getCollection();
      return await collection.find({ parentId }).limit(limit).toArray();
    } catch (error) {
      console.error('Error in User.findByParentId:', error);
      throw error;
    }
  }
}

class Session extends BaseCollection {
  constructor() {
    super('sessions');
  }
}

class Transaction extends BaseCollection {
  constructor() {
    super('transactions');
  }

  async findByUserAndType(userId, type, virtual = null) {
    try {
      const collection = await this.getCollection();
      let query = { user_id: userId, type };
      
      if (virtual !== null) {
        query.virtual = virtual;
      }
      
      return await collection.find(query).toArray();
    } catch (error) {
      console.error('Error in Transaction.findByUserAndType:', error);
      throw error;
    }
  }

  async findUserTransactions(userId) {
    try {
      const collection = await this.getCollection();
      return await collection.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: '$virtual',
            transactions: { $push: '$$ROOT' },
            totalIn: {
              $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$value', 0] }
            },
            totalOut: {
              $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$value', 0] }
            }
          }
        }
      ]).toArray();
    } catch (error) {
      console.error('Error in Transaction.findUserTransactions:', error);
      throw error;
    }
  }
}

class Tree extends BaseCollection {
  constructor() {
    super('tree');
  }
}

class Banner extends BaseCollection {
  constructor() {
    super('banner');
  }

  async findOne(query, options = {}) {
    const cacheKey = `banner:${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached !== null) {
      console.log('Cache hit for banner');
      return cached;
    }

    console.log('Cache miss for banner');
    const result = await super.findOne(query, options);
    cache.set(cacheKey, result, 10 * 60 * 1000); // 10 minutos
    return result;
  }
}

class Plan extends BaseCollection {
  constructor() {
    super('plans');
  }

  async find(query, options = {}) {
    const cacheKey = `plans:${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached !== null) {
      console.log('Cache hit for plans');
      return cached;
    }

    console.log('Cache miss for plans');
    const result = await super.find(query, options);
    cache.set(cacheKey, result, 15 * 60 * 1000); // 15 minutos
    return result;
  }
}

class DashboardConfig extends BaseCollection {
  constructor() {
    super('dashboard_config');
  }

  async findOne(query, options = {}) {
    const cacheKey = `dashboard_config:${JSON.stringify(query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached !== null) {
      console.log('Cache hit for dashboard_config');
      return cached;
    }

    console.log('Cache miss for dashboard_config');
    const result = await super.findOne(query, options);
    cache.set(cacheKey, result, 20 * 60 * 1000); // 20 minutos
    return result;
  }

  async insert(document) {
    // Limpiar caché al insertar nueva configuración
    cache.delete(`dashboard_config:{}`);
    return super.insert(document);
  }
}

class Affiliation extends BaseCollection {
  constructor() {
    super('affiliations');
  }

  async findOneLast(query) {
    try {
      const collection = await this.getCollection();
      const results = await collection.find(query).sort({ _id: -1 }).limit(1).toArray();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error in Affiliation.findOneLast:', error);
      throw error;
    }
  }
}

class Product extends BaseCollection {
  constructor() {
    super('products');
  }
}

class Activation extends BaseCollection {
  constructor() {
    super('activations');
  }
}

class Period extends BaseCollection {
  constructor() {
    super('periods');
  }

  async findOneLast(query) {
    try {
      const collection = await this.getCollection();
      const results = await collection.find(query).sort({ _id: -1 }).limit(1).toArray();
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error in Period.findOneLast:', error);
      throw error;
    }
  }
}

class Promo extends BaseCollection {
  constructor() {
    super('promos');
  }
}

class Prom extends BaseCollection {
  constructor() {
    super('promo');
  }
}

class Token extends BaseCollection {
  constructor() {
    super('tokens');
  }
}

class Collect extends BaseCollection {
  constructor() {
    super('collects');
  }

  async findPaginated(query, skip = 0, limit = 50) {
    try {
      const collection = await this.getCollection();
      return await collection
        .find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error in Collect.findPaginated:', error);
      throw error;
    }
  }
}

class OfficeCollect extends BaseCollection {
  constructor() {
    super('office_collects');
  }
}

class Office extends BaseCollection {
  constructor() {
    super('offices');
  }
}

class Recharge extends BaseCollection {
  constructor() {
    super('recharges');
  }
}

class Closed extends BaseCollection {
  constructor() {
    super('closeds');
  }
}

class PaymentMethod extends BaseCollection {
  constructor() {
    super('payment_methods');
  }
}

class Flyer extends BaseCollection {
  constructor() {
    super('flyers');
  }
}

class DB {
  constructor() {
    this.User = new User();
    this.Session = new Session();
    this.Affiliation = new Affiliation();
    this.Product = new Product();
    this.Activation = new Activation();
    this.Period = new Period();
    this.Banner = new Banner();
    this.Promo = new Promo();
    this.Prom = new Prom();
    this.Plan = new Plan();
    this.Token = new Token();
    this.Transaction = new Transaction();
    this.Tree = new Tree();
    this.Collect = new Collect();
    this.OfficeCollect = new OfficeCollect();
    this.Office = new Office();
    this.Recharge = new Recharge();
    this.Closed = new Closed();
    this.PaymentMethod = new PaymentMethod();
    this.DashboardConfig = new DashboardConfig();
    this.Flyer = new Flyer();
  }
}

module.exports = new DB();
