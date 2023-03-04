import sha1 from 'sha1';
import { v4 } from 'uuid';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    const auth = req.header('Authorization');

    const buff = Buffer.from(auth.slice(5, auth.length - 1), 'base64');
    const text = buff.toString('utf-8');
    // console.log(typeof auth)
    //     const val = auth.slice(5, auth.length - 1);
    //     const text = decodeURIComponent(atob(val));
    // res.status(200).json({ "text": text })
    // return
    const email = text.split(':')[0];
    const password = text.split(':')[1];
    try {
      const user = await (await dbClient.usersCollection())
        .findOne({ email, password: sha1(password) });

      const token = v4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id, 24 * 60 * 60);
      res.status(200).json({ token });
      return;
    } catch (e) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    try {
      const key = await redisClient.get(`auth_${token}`);
      console.log(key);
      if (!key) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await redisClient.del(`auth_${token}`);
      res.status(204).send();
      return;
    } catch (e) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
