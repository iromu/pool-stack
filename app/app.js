/* global process:true, __dirname:true */

'use strict';

var path = require('path'),
    restify = require('restify'),
    config = require('config'),
    repository = require('./repository'),
    routes = require('./routes');

var bluebird = require('bluebird');
bluebird.onPossiblyUnhandledRejection(function (err) {
    throw err;
});
var corsMiddleware = require('restify-cors-middleware');
var cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: ['*'],
    allowHeaders: ['API-Token'],
    exposeHeaders: ['API-Token-Expiry']
})


exports.createServer = createServer;


/*
 * Set up server
 * @return the created server
 */
function createServer(logger) {

    var settings = {
        name: (config.has('server.name') && config.get('server.name')) ? config.get('server.name')
            : require(path.join(__dirname, 'package')).name
    };

    if (logger) settings.log = logger;

    var server = restify.createServer(settings);

    server.pre(cors.preflight);
    server.use(cors.actual);
    server.pre(restify.pre.pause());
    server.use(restify.plugins.acceptParser(server.acceptable));
    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.bodyParser({mapParams: false}));

    server.on('NotFound', function (req, res, next) {
        if (logger) {
            logger.debug('404', 'No route that matches request for ' + req.method + ' ' + req.url);
        }
        res.send(404, req.url + ' was not found');
    });

    server.on('uncaughtException', function (req, res, route, err) {
        if (logger) {
            logger.error('Uncaught error', err);
        }
        return res.send(500, 'Error');
    });

    if (logger) server.on('after', restify.plugins.auditLogger({event: 'routed', log: logger}));

    if (logger) {
        repository.setLogger(logger);
    }

    routes(server, repository, logger);

    return server;
}
