/* global __dirname:true */

var fs = require('fs'),
    path = require('path');

function initialize(server, logger) {

    server.get('/', function (req, res, next) {
        res.send({'message': 'Restify is online and operational.'});
        return next();
    });

};

var routes = [
    'test',
    'pool'
];

module.exports = function (server, repository, logger) {
    initialize(server, repository, logger);

    routes.forEach(function (route) {
        try {
            require(path.join(__dirname, route))(server, repository, logger);
        } catch (err) {
            throw new Error("Can't load '" + route + "' route");
        }
    });
};
