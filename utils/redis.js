import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
        constructor() {
                this.client = createClient()
                this.live = true

                this.client.on("error", (err) => {
                        console.log("Error");
                        this.live = false;

                });
                this.client.on("connect", () => {
                        // console.log("success");
                        this.live = true;
                })
        }

        isAlive() {

                return true

        }

        async get(key) {
                return promisify(this.client.GET).bind(this.client)(key)
        }
        async set(key, val, duration) {
                await this.client.setex(key, duration, val)
        }
        async del(key) {
                await this.client.del(key)
        }

}

const redisClient = new RedisClient();

module.exports = redisClient;
