module.exports = function(server) {

  // Sample route
  server.get('/ping', function (req, res, next) {
    res.send({ 'result': 'pong' });
    return next();
  });
  
};
