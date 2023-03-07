import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(dbURL, { useUnifiedTopology: true });
    this.live = false;
    this.client.connect((err) => {
      if (err) {
        this.live = false;
        // console.log("Connection to Mongo DB failed");
      } else {
        this.live = true;
        // console.log("Mongo DB Connected Successfully!")
      }
    });
    // console.log(this.client.db(), "the database")
  }

  isAlive() {
    return this.live;
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  async usersCollection() {
    return this.client.db().collection('users');
  }

  async filesCollection() {
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
