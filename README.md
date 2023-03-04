File manager in node js





import { config } from 'dotenv';

const { MongoClient } = require('mongodb');
config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isAlive();
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

//   async nbFiles() {
//     return 10;
//   }

}

const dbClient = new DBClient();
module.exports = dbClient;
