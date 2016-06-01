(function () {
    'use strict';
    var logger;
    var config = require('config');
    var redis = require('redis');
    var Promise = require('bluebird');

    Promise.promisifyAll(redis.RedisClient.prototype);
    Promise.promisifyAll(redis.Multi.prototype);

    var redisConf = require('redis-url').parse(config.get('redis.url'));
    var redisClient;
    var cacheClient;

    var newClient = function (options) {
        logger.debug('Redis connecting to ' + redisConf.hostname + ':' + redisConf.port);
        var redisClient = redis.createClient(redisConf.port, redisConf.hostname, options);
        if (redisConf.password) {
            redisClient.auth(redisConf.password, function (err) {
                if (err) throw err;
            });
        }
        redisClient.on('connect', function () {
            logger.debug('Redis connected to ' + redisConf.hostname + ':' + redisConf.port);
        });
        redisClient.on('error', function (err) {
            logger.debug('Redis error ' + err);
        });
        return redisClient;
    };

    var getRedisClient = function () {
        if (redisClient === undefined) {
            redisClient = newClient();
        }
        return redisClient;
    };

    var cacheClientBuilder = function (param) {
        var client = param.client;
        var prefix = param.prefix;

        return {
            get: function (key) {
                return client.getAsync(prefix + key);
            },
            set: function (key, data, ttl) {
                if (ttl && ttl > 0) {
                    return client.setexAsync(prefix + key, ttl, data);
                } else {
                    return client.setAsync(prefix + key, data);
                }
            },
            addAllSet: function (key, array, locking) {
                var multi = client.multi();
                for (var i = 0; i < array.length; i++) {
                    if (locking) {
                        multi.sadd(prefix + key + ':data', array[i]);
                        multi.sadd(prefix + key + ':lock', array[i]);
                    }
                    else {
                        multi.sadd(prefix + key, array[i]);
                    }
                }
                return multi.execAsync();
            },
            members: function (key, locking) {
                if (locking) {
                    return client.smembersAsync(prefix + key + ':data');
                }
                else {
                    return client.smembersAsync(prefix + key);
                }
            },
            addSet: function (key, member) {
                return client.saddAsync(prefix + key, member);
            },
            pop: function (key) {
                return client.spopAsync(prefix + key);
            },
            hset: function (key, data) {
                return client.hset(prefix + key, data);
            },
            purge: function () {
                return new Promise(function (resolve, reject) {
                    logger.debug('Purge all keys ' + prefix + '*');
                    client.keys(prefix + '*', function (err, keys) {
                        if (keys && keys.length < 1) return reject();

                        client.del(keys, function (err, count) {
                            count = count || 0;
                            resolve(count);
                        });
                    });
                });
            }
        }
    };

    var getCacheClient = function () {
        if (cacheClient === undefined) {
            cacheClient = cacheClientBuilder({
                client: getRedisClient(),
                prefix: config.get('redis.prefix')
            });

            if (config.get('redis.purgeOnLoad')) {
                getRedisClient().on('connect', function () {
                    cacheClient.purge();
                });
            }
        }
        return cacheClient;
    };


    module.exports.persistSet = function (key, value) {
        if (value instanceof Array) {
            return getCacheClient().addAllSet(key, value, true);
        } else {
            return getCacheClient().set(key, value);
        }
    };
    module.exports.retrieveSet = function (key) {
        return getCacheClient().members(key, true);
    };
    module.exports.acquireLock = function (key) {
        return getCacheClient().pop(key + ':lock');
    };
    module.exports.freeLock = function (key, member) {
        return getCacheClient().addSet(key + ':lock', member);
    };
    module.exports.setLogger = function (logger_) {
        logger = logger_;
    };

}());
