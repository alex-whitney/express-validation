'use strict';

var validation = require('../lib/index')
    , should = require('should');

describe('validate errors', function () {

    var err;

    before(function (done) {
        var validate = validation(require('./validation/login'));
        var req = {
            body: {
                email: "andrew.keiggmail.com",
                password: "12356"
            }
        };

        validate(req, {}, function (_err) {
            err = _err;
            done();
        });
    });

    it('should generate an instance of Error', function() {
        should.ok(err instanceof Error);
    });

    it('should generate an instance of ValidationError', function () {
        should.ok(err instanceof validation.ValidationError);
    });

    it('should contain a stack trace', function () {
        should.exist(err.stack);
    });

    it('should have a name of ValidationError', function () {
        should(err).have.property('name', 'ValidationError');
    });

    it('should have a status property of 400', function () {
        should(err).have.property('status', 400);
    });

});