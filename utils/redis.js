import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.live = true;

    this.client.on('error', () => {
      console.error('Error fail');
      this.live = false;
    });
    this.client.on('connect', () => {
      this.live = true;
    });
    this.client.connect();
  }

  isAlive() {
    return this.live;
  }

  async get(key) {
    return promisify(this.client.GET).bind(this.client)(key);
  }

  async set(key, val, duration) {
    await promisify(this.client.SETEX).bind(this.client)(key, duration, val);
  }

  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

export const redisClient = new RedisClient();

export default redisClient;
