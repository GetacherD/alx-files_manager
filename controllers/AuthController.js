import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    //     console.log(req);
    const auth = req.header('Authorization');
    if (!auth) {
      res.status(400).json({ error: 'No authorization header' });
      return;
    }
    console.log(auth.slice(0, 7));
    if (auth.slice(0, 6).toLowerCase() !== 'Basic '.toLowerCase()) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const buff = Buffer.from(auth.slice(6), 'base64');
    const text = buff.toString('utf-8');
    const email = text.split(':')[0];
    const password = text.split(':')[1];
    try {
      const user = await (await dbClient.usersCollection())
        .findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (user.password !== sha1(password)) {
        res.status(403).json({ error: 'Invalid credentials' });
        return;
      }
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 86400);
      res.status(200).json({ token });
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    try {
      // const key = await redisClient.get(`auth_${token}`);
      // if (!key) {
      //   res.status(401).json({ error: 'Unauthorized' });
      //   return;
      // }
      await redisClient.del(`auth_${token}`);
      res.status(204).send('');
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
