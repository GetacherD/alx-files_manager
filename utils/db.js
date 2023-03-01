const { MongoClient } = require("mongodb");

import { config } from 'dotenv';

config();


const uri = 'mongodb://127.0.0.1:27017';

const client = new MongoClient(uri);


class DBClient {
        constructor() {

        }
}
