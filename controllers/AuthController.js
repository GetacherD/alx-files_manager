import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    try {
      const auth = req.headers.authorization;
      if (!auth) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (auth.slice(0, 6) !== 'Basic ') {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const buff = Buffer.from(auth.slice(6), 'base64');
      const text = buff.toString('utf-8');
      const email = text.split(':')[0];
      const password = text.split(':')[1];
      console.log(email, password);
      if (!email || !password) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const user = await (await dbClient.usersCollection())
        .findOne({ email, password: sha1(password) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);
      res.status(200).json({ token: token.toString() });
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getDisconnect(req, res) {
    try {
      // const key = await redisClient.get(`auth_${token}`);
      // if (!key) {
      //   res.status(401).json({ error: 'Unauthorized' });
      //   return;
      // }
      const token = req.headers['x-token'];
      console.log(token);
      const userId = await redisClient.get(`auth_${token}`);
      console.log(userId);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      await redisClient.del(`auth_${token}`);
      res.status(204).send();
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
