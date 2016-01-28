/** @namespace req.params */
module.exports = function (server, repository, logger) {

    server.get('/pool/:name', function (req, res, next) {
        res.send({'result': req.params.name});
        return next();
    });

    server.put('/pool/:name', function (req, res, next) {
        //assert.ifError(err);
        var obj = req.body;
        logger.info('%d -> %j', res.statusCode, res.headers);
        logger.info('%j', obj);
        // repository.put();
        res.send({[req.params.name]: req.body});
        return next();
    });

    server.post('/pool', function (req, res, next) {
        // assert.ifError(err);
        var obj = req.body;
        logger.info('%d -> %j', res.statusCode, res.headers);
        logger.info('%j', obj);
        var firstProp, firstPropName;
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                firstProp = obj[key];
                firstPropName = key;
                break;
            }
        }
        res.send({[firstPropName]: firstProp});
        return next();
    });

};
