const { MongoClient } = require('mongodb');

class DatabasePool {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect() {
    if (this.isConnected && this.db) {
      return this.db;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this._createConnection();
    return this.connectionPromise;
  }

  async _createConnection() {
    try {
      const URL = process.env.DB_URL;
      const name = process.env.DB_NAME;

      if (!URL || !name) {
        throw new Error('DB_URL or DB_NAME not defined in environment variables');
      }

      this.client = new MongoClient(URL, {
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maximum number of connections in the pool
        minPoolSize: 2,  // Minimum number of connections to maintain
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        serverSelectionTimeoutMS: 5000, // How long to try selecting a server
        socketTimeoutMS: 45000, // How long a send or receive on a socket can take
      });

      await this.client.connect();
      this.db = this.client.db(name);
      this.isConnected = true;

      // Handle connection errors
      this.client.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('MongoDB connection closed');
        this.isConnected = false;
      });

      console.log('Connected to MongoDB with connection pooling');
      return this.db;

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      this.connectionPromise = null;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      this.connectionPromise = null;
    }
  }

  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

// Create a singleton instance
const dbPool = new DatabasePool();

module.exports = dbPool;
