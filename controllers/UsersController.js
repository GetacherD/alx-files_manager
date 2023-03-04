import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await (await dbClient.usersCollection()).findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    const insertionInfo = await (await dbClient.usersCollection())
      .insertOne({ email, password: sha1(password) });
    const userId = insertionInfo.insertedId.toString();

    res.status(201).json({ email, id: userId });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    try {
      const idd = await redisClient.get(`auth_${token}`);
      console.log(idd, 'idd is');
      if (!idd) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const obj = await (await dbClient.usersCollection()).findOne({ _id: ObjectId(idd) });

      res.status(200).json({ email: obj.email, id: obj._id });
      return;
    } catch (e) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
