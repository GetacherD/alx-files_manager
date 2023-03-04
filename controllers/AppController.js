import dbClient from '../utils/db';

export default class AppController {
  static async getStats(req, res) {
    const usr = await dbClient.nbUsers();
    const fls = await dbClient.nbFiles();
    res.status(200).json(
      { users: usr, files: fls },
    );
  }

  static getStatus(req, res) {
    (async () => {
      if (dbClient.isAlive && dbClient.isAlive) {
        res.status(200).json(
          { redis: true, db: true },
        );
      }
    })();
  }
}
