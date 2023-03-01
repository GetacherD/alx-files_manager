
import { createClient } from "redis";
import { promisify } from 'util'

class RedisClient {
        constructor() {
                this.client = createClient()

                this.client.on("error", (err) => {
                        console.log("Error")

                });
                this.client.on("connect", () => {
                        console.log("success")

                })
                // this.client.connect()


        }

        isAlive() {

                return true

        }

        async get(key) {

                let val = this.client.get(key)
                console.log("val is", val)

        }
        async set(key, val, duration) {
                await this.client.setex(key, duration, val)
        }
        async del(key) {
                await this.client.del(key)
        }


}


const redisClient = new RedisClient()



module.exports = redisClient;