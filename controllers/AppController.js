import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AppController {
  static getStatus(req, res) {
    (async () => {
      const usr = await dbClient.nbUsers();
      const fls = await dbClient.nbFiles();

      res.status(200).json(
        { users: usr, files: fls },
      );
    })();
  }

  static getStats(req, res) {
    (async () => {
      if (dbClient.isAlive && dbClient.isAlive) {
        res.status(200).json(
          { redis: true, db: true },
        );
      }
    })();
  }
}
