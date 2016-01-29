'use strict';

var  path = require('path');

function initialize(server) {

    server.get('/', function (req, res, next) {
        res.send({'message': 'Restify is online and operational.'});
        return next();
    });

}

var routes = [
    'test',
    'pool'
];

module.exports = function (server, repository, logger) {
    initialize(server, repository, logger);

    routes.forEach(function (route) {
        try {
            //noinspection JSUnresolvedVariable
            require(path.join(__dirname, route))(server, repository, logger);
        } catch (err) {
            logger.error(err);
            throw new Error("Can't load '" + route + "' route");
        }
    });
};
