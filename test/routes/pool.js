/* global describe:true, before:true, after:true, it:true, baseURL:true */

'use strict';

var should = require('chai').should(),
    request = require('supertest');

var pools = [
    {name: 'REPTILES', members: ['Turtle', 'Tortoise', 'Snake', 'Cobra']},
    {name: 'BIRDS', members: ['Vulture', 'Toucan', 'Thick-Billed Parrot', 'Steller\'s Sea-Eagle']}
];

var seedPools = function (done) {
    var counter = 0;
    pools.forEach(function (pool) {
        request(baseURL)
            .put('/pool/' + pool.name)
            .send(pool.members)
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) console.log('ERROR IN THE SET UP. pool ' + pool.name);
                res.body.should.deep.equal(pool.members);
                counter++;
            });

    });
    var checkSetupInterval;

    function checkSetup() {
        if (counter >= pools.length) {
            clearInterval(checkSetupInterval);
            return done();
        }
    }

    checkSetupInterval = setInterval(checkSetup, 100);
    setTimeout(done, 10000);
};

describe("/pool", function () {


    var shouldBeExpectedPoolResponse = function (res, poolName, poolMembers) {
        res.body.should.be.an('object');
        res.body.should.have.ownProperty(poolName);
        res.body[poolName].should.deep.equal(poolMembers);
    };

    describe("/pool bulk operations", function () {
        before(seedPools);
        describe('GET /pool/NONE', function () {
            it('should return 404 (Not Found) }', function (done) {
                request(baseURL)
                    .get('/pool/NONE')
                    .set('Accept', 'application/json')
                    .expect(404)
                    .end(function (err) {
                        if (err) return done(err);
                        return done();
                    });
            });
        });

        describe('GET /pool', function () {
            it('should return 400 (Bad Request) }', function (done) {
                request(baseURL)
                    .get('/pool/')
                    .set('Accept', 'application/json')
                    .expect(400)
                    .end(function (err) {
                        if (err) return done(err);
                        return done();
                    });
            });
        });

        describe('PUT /pool/ without payload', function () {
            it('should return 400 (Bad Request) }', function (done) {
                request(baseURL)
                    .put('/pool/')
                    .set('Accept', 'application/json')
                    .expect(400)
                    .end(function (err) {
                        if (err) return done(err);
                        return done();
                    });
            });
        });

        pools.forEach(function (pool) {
            describe('PUT /pool/' + pool.name, function () {
                it('should return ' + JSON.stringify(pool.members), function (done) {
                    request(baseURL)
                        .put('/pool/' + pool.name)
                        .send(pool.members)
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);
                            res.body.should.deep.equal(pool.members);
                            return done();
                        });
                });
            });
        });

        pools.forEach(function (pool) {
            var payload = {[pool.name]: pool.members};
            var payloadAsString = JSON.stringify(payload);
            describe('POST /pool with payload ' + payloadAsString, function () {
                it('should return ' + payloadAsString, function (done) {
                    request(baseURL)
                        .post('/pool')
                        .send(payload)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);
                            shouldBeExpectedPoolResponse(res, pool.name, pool.members);
                            return done();
                        });
                });
            });
        });

        pools.forEach(function (pool) {
            describe('GET /pool/' + pool.name, function () {
                it('should respond ' + pool.members, function (done) {
                    request(baseURL)
                        .get('/pool/' + pool.name)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);
                            res.body.sort().should.deep.equal(pool.members.sort());
                            return done();
                        });
                });
            });
        });
    });


    describe("/pool member operations", function () {
        pools.forEach(function (pool) {
            before(function (done) {
                request(baseURL)
                    .put('/pool/' + pool.name)
                    .send(pool.members)
                    .expect('Content-Type', 'application/json')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) console.log('ERROR IN THE SET UP. pool ' + pool.name);
                        res.body.should.deep.equal(pool.members);
                        return done();
                    });
            });

            describe('POST /pool/' + pool.name, function () {
                it('should return a lock', function (done) {
                    request(baseURL)
                        .post('/pool/' + pool.name + '/lock')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);
                            res.body.should.be.an('string');
                            res.body.should.match(/.+/);
                            return done();
                        });
                });
            });

            describe('DELETE /pool/' + pool.name + '/lock/:resource', function () {
                var lockResponse = 'UNSET';

                before(function (done) {
                    request(baseURL)
                        .post('/pool/' + pool.name + '/lock')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) console.log('ERROR IN THE SET UP. lock pool ' + pool.name);
                            res.body.should.be.an('string');
                            res.body.should.match(/.+/);
                            lockResponse = res.body;
                            done();
                        });
                });

                it('should release a lock over the resource ' + lockResponse, function (done) {
                    request(baseURL)
                        .delete('/pool/' + pool.name + '/lock/' + lockResponse)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);
                            res.body.should.be.empty;
                            return done();
                        });
                });
            });
        });
    });
});


