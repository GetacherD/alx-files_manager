import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.live = true;

    this.client.on('error', () => {
      console.error('redis server is offline');
      this.live = false;
    });
    this.client.on('connect', () => {
      this.live = true;
    });
  }

  isAlive() {
    return this.live;
  }

  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
  }

  async set(key, val, duration) {
    await this.client.SETEX(key, duration, val);
  }

  async del(key) {
    await this.client.DEL(key);
  }
}
const redisClient = new RedisClient();

export default redisClient;
