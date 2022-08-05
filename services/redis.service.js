const redis = require('redis');

const REDIS_EXPIRATION = 'EX';

class RedisService {
    #redisClient = null;
    constructor() {
        this.#redisClient = redis.createClient({url: process.env.REDIS_URL});
        this.#redisClient.connect();
        this.#redisClient.on('error', (err) => {
            console.log('Redis Client Error', JSON.stringify(err));
            this.#redisClient.connect()
                .catch(e => console.log(`Redis client error on connect ${JSON.stringify(e)}`));
        });
    }

    put(k, v, exp) {
        (exp)
            ? this.#redisClient.set(k, v, REDIS_EXPIRATION, exp)
            : this.#redisClient.set(k, v);
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
}

const service = new RedisService();

module.exports = service;
