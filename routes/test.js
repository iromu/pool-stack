module.exports = function(server, logger) {

  // Sample route
  server.get('/ping', function (req, res, next) {
    res.send({ 'result': 'pong' });
    return next();
  });
  
};
