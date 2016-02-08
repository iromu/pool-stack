'use strict';

var errors = require('restify-errors');

module.exports = function (server, repository, logger) {

    var controller = {
        getPool: function (req, res, next) {
            try {
                if (!req.params.name) {
                    return next(new errors.BadRequestError());
                }
                var sendResult = function (result) {
                    if (!result || (result instanceof Array && result.length === 0)) {
                        return next(new errors.NotFoundError());
                    }
                    res.send(result);
                    return next();
                };

                repository.retrieveSet(req.params.name)
                    .then(sendResult)
                    .catch(next.ifError);
            } catch (err) {
                next.ifError(err);
            }
        },
        updatePool: function (req, res, next) {
            try {
                if (!req.params.name) {
                    return next(new errors.BadRequestError());
                }
                repository.persistSet(req.params.name, req.body)
                    .then(result => {
                        res.send(req.body);
                        return next();
                    })
                    .catch(next.ifError);
            } catch (err) {
                next.ifError(err);
            }
        },
        createPool: function (req, res, next) {
            try {
                var obj = req.body;
                var firstProp, firstPropName;
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        firstProp = obj[key];
                        firstPropName = key;
                        break;
                    }
                }
                repository.persistSet(firstPropName, firstProp)
                    .then(result => {
                        logger.info('%j', result);
                        res.send({[firstPropName]: firstProp});
                        return next();
                    })
                    .catch(next.ifError);
            } catch (err) {
                next.ifError(err);
            }
        },
        acquireLock: function (req, res, next) {
            try {
                if (!req.params.name) {
                    return next(new errors.BadRequestError());
                }
                var sendResult = function (result) {
                    if (!result)  return next(new errors.NotFoundError());
                    var ob = {};
                    ob[req.params.name] = result;
                    res.send(result);
                    return next();
                };

                repository.acquireLock(req.params.name)
                    .then(sendResult)
                    .catch(next.ifError);
            } catch (err) {
                next.ifError(err);
            }
        },
        freeLock: function (req, res, next) {
            try {
                if (!req.params.name || !req.params.member) {
                    return next(new errors.BadRequestError());
                }
                var sendResult = function (result) {
                    if (!result)  return next(new errors.NotFoundError());
                    res.send('');
                    return next();
                };

                repository.freeLock(req.params.name, req.params.member)
                    .then(sendResult)
                    .catch(next.ifError);
            } catch (err) {
                next.ifError(err);
            }
        }
    };

    server.get('/pool/:name', controller.getPool);
    server.put('/pool/:name', controller.updatePool);
    server.post('/pool', controller.createPool);
    server.post('/pool/:name/lock', controller.acquireLock);
    server.del('/pool/:name/lock/:member', controller.freeLock);

};
