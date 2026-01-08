const dbPool = require('./db-pool');

class BaseCollection {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async getCollection() {
    const db = await dbPool.connect();
    return db.collection(this.collectionName);
  }

  async findOne(query, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.findOne(query, options);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.findOne:`, error);
      throw error;
    }
  }

  async find(query, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.find(query, options).toArray();
    } catch (error) {
      console.error(`Error in ${this.collectionName}.find:`, error);
      throw error;
    }
  }

  async insert(document) {
    try {
      const collection = await this.getCollection();
      return await collection.insertOne(document);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.insert:`, error);
      throw error;
    }
  }

  async updateOne(query, update, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.updateOne(query, update, options);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.updateOne:`, error);
      throw error;
    }
  }

  async updateMany(query, update, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.updateMany(query, update, options);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.updateMany:`, error);
      throw error;
    }
  }

  async deleteOne(query, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.deleteOne(query, options);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.deleteOne:`, error);
      throw error;
    }
  }

  async deleteMany(query, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.deleteMany(query, options);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.deleteMany:`, error);
      throw error;
    }
  }

  async countDocuments(query, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.countDocuments(query, options);
    } catch (error) {
      console.error(`Error in ${this.collectionName}.countDocuments:`, error);
      throw error;
    }
  }

  // Aggregation method for complex queries
  async aggregate(pipeline, options = {}) {
    try {
      const collection = await this.getCollection();
      return await collection.aggregate(pipeline, options).toArray();
    } catch (error) {
      console.error(`Error in ${this.collectionName}.aggregate:`, error);
      throw error;
    }
  }
}

module.exports = BaseCollection;
