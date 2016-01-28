/* global describe:true, before:true, after:true, it:true, baseURL:true */

'use strict';

var should = require('chai').should(),
    request = require('supertest');


describe("/pool", function () {

    beforeEach(function (done) {
        request(baseURL)
            .put('/pool/A')
            .send(['1', '2', '3', '4'])
            .set('Accept', 'application/json')
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) console.log('ERROR IN THE SET UP.');
                return done();
            });
    });

    it('should return { "result": "A" }', function (done) {
        request(baseURL)
            .get('/pool/A')
            .set('Accept', 'application/json')
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);

                res.body.should.be.an('object');
                res.body.should.have.ownProperty('result');
                res.body.result.should.equal("A");

                return done();
            });
    });

    it('should return 404 (Not Found) }', function (done) {
        request(baseURL)
            .get('/pool/A/5')
            .set('Accept', 'application/json')
            .expect(404)
            .end(function (err) {
                if (err) return done(err);
                return done();
            });
    });

    it('should return { "A": [ "1", "2", "3", "4" ] }', function (done) {
        request(baseURL)
            .post('/pool')
            .send({'A': ['1', '2', '3', '4']})
            .set('Accept', 'application/json')
            .expect('Content-Type', 'application/json')
            .expect(200)
            .end(function (err, res) {
                if (err) return done(err);

                res.body.should.be.an('object');
                res.body.should.have.ownProperty('A');
                res.body.A.should.be.instanceof(Array);
                res.body.A.should.deep.equal(['1', '2', '3', '4']);

                return done();
            });
    });

});
