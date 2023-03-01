const { MongoClient } = require('mongodb');
import { config } from 'dotenv';
import { promisify } from 'util';
config();
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
let DB_DATABSE = process.env.DB_DATABASE;
if (!DB_DATABSE) {
        DB_DATABSE = "files_manager";
}


class DBClient {
        constructor(db_host, db_port, dbname) {
                this.client = new MongoClient(`mongodb://${db_host}:${db_port}`);
                this.db = this.client.db(dbname);
                this.client.connect();
                this.users = this.db.collection("users");
                this.files = this.db.collection("files");

        }
        isAlive() {

                return true;
        }
        async nbUsers() {
                let data = await this.client.db.users.find({}).count()
                return data;
        }
        async nbFiles() {
                return 10;
        }

}

const dbClient = new DBClient(DB_HOST, DB_PORT, DB_DATABSE);
module.exports = dbClient;