/* global describe:true, before:true, after:true, it:true, baseURL:true */

'use strict';

var should = require('chai').should(),
    request = require('supertest'),
    async = require('async'), querystring = require("querystring");

var pools = [
    {
        name: 'REPTILES',
        members: ['Turtle', 'Tortoise', 'Cobra', 'Snake']
            .sort()
    },
    {
        name: 'BIRDS',
        members: ['Steller\'s Sea-Eagle', 'Thick-Billed Parrot', 'Toucan', 'Vulture']
            .sort()
    }
];

var shouldReturnALockConcurrent = function (pool, parallelRuns, done) {
    var actualRuns = 0;
    var membersAcquired = [];
    var asyncTask = function (callback) {
        request(baseURL)
            .post('/pool/' + pool.name + '/lock')
            .set('Accept', 'application/json')
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) return callback(err);
                res.body.should.be.an('string');
                res.body.should.match(/.+/);
                membersAcquired.should.not.include(res.body);
                membersAcquired.push(res.body);
                callback(null, null);
            });
    };
    var asyncTasks = [];
    while (parallelRuns > actualRuns) {
        actualRuns++;
        asyncTasks.push(asyncTask);
    }
    async.parallel(asyncTasks, function (err, result) {
        if (err) return done(err);
        done();
    });
};
describe("/pool", function () {

    describe("/pool expected errors", function () {

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
    });

    describe("/pool bulk operations", function () {
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
                            res.body.should.be.an('object');
                            res.body.should.have.ownProperty(pool.name);
                            res.body[pool.name].should.deep.equal(pool.members);
                            return done();
                        });
                });
            });

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

            describe('GET /pool/' + pool.name, function () {
                it('should respond ' + pool.members, function (done) {
                    request(baseURL)
                        .get('/pool/' + pool.name)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) return done(err);
                            res.body.sort().should.deep.equal(pool.members);
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

            describe('POST /pool/' + pool.name + '/lock', function () {
                it('should return a lock', function (done) {
                    shouldReturnALockConcurrent(pool, 3, done);
                });
            });

            describe('DELETE /pool/' + pool.name + '/lock/:resource', function () {

                it('should release a lock over the :resource', function (done) {
                    request(baseURL)
                        .post('/pool/' + pool.name + '/lock')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            if (err) console.log('ERROR IN THE SET UP. locking pool ' + pool.name);
                            res.body.should.be.an('string');
                            res.body.should.match(/.+/);
                            pool.members.should.include(res.body);
                            var lockResponse = res.body;
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

    describe("/pool concurrent tests", function () {
        this.timeout(15000);
        var guidDataset = require('./guid.json');
        var pool = {name: 'guid', members: guidDataset};

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

        describe('POST /pool/' + pool.name + '/lock', function () {
            it('should return a lock', function (done) {
                shouldReturnALockConcurrent(pool, 8, done);
            });
        });

    });
});


