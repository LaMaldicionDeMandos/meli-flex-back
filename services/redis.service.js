const redis = require('redis');
const CONF = {url: process.env.REDIS_URL};
class RedisService {
    #redisClient = null;

    get EXPIRED() {
        return -2;
    }
    constructor() {
        this.#redisClient = redis.createClient(CONF);
        this.#connect();
    }

    put(k, v, exp) {
        this.#redisClient.set(k, v);
        if (exp) this.#redisClient.expire(k, exp);
    }

    get(k) {
        return this.#redisClient.get(k);
    }

    // -1: not expire
    // -2: not found
    ttl(k) {
        return this.#redisClient.ttl(k);
    }

    async deleteKey(k) {
        console.log('Deleting key: ' + k);
        const deleted = await this.#redisClient.del(k);
        console.log('key deleted ', deleted);
        return deleted;
    }

    #connect = () => {
        this.#redisClient.connect();
        this.#redisClient.on('error', (err) => {
            console.log('Redis Client Error', JSON.stringify(err));
            this.#redisClient.connect()
              .catch(e => console.log(`Redis client error on connect ${JSON.stringify(e)}`));
        });
    }
}

const service = new RedisService();

module.exports = service;
