'use strict';

var Joi = require('joi');
var _ = require('lodash');
var util = require('util');

var ValidationError = function (errors, options) {
    Error.call(this);
    Error.captureStackTrace(this, ValidationError);

    this.errors = errors;
    this.status = options.status || 400;
    this.statusText = options.statusText || 'Bad Request';
    this.flatten = options.flatten || false;

    this.name = 'ValidationError';
    this.message = this.statusText;
};
util.inherits(ValidationError, Error);
ValidationError.prototype.toString = function () {
    return JSON.stringify(this.toJSON());
};
ValidationError.prototype.toJSON = function () {
    var response = {
        status : this.status,
        statusText : this.statusText,
        errors : this.errors
    };

    if (this.flatten){
        response = _.flatten(_.pluck(this.errors, 'messages'));
    }

    return response;
};

var validate = function (schema) {
    if (!schema) {
        throw new Error("Please provide a validation schema");
    }

    return function (req, res, next)  {

        var validate = function(current, request, schema, location, allowUnknown){

            if (!request || !schema) {
                return;
            }

            Joi.validate(request, schema, {allowUnknown : allowUnknown, abortEarly : false}, function(errors, value){
                if (!errors || errors.details.length === 0) {
                    return;
                }

                _.each(errors.details, function(error){
                    var errorExists = _.find(current, function(item){
                        if (item && item.field === error.path && item.location === location) {
                            item.messages.push(error.message);
                            return item;
                        }
                        return;
                    });

                    if (!errorExists) {
                        current.push({ field : error.path, location : location, messages : [error.message]});
                    }

                }, errors);
            });
        };

        var errors = [];

        var pushErrors = function(errors, error){
            if (error) {
                errors.push(error);
            }
        };

        // Set default options
        var options = schema.options || {};

        options = _.defaults(options, {
            flatten: false,
            allowUnknownHeaders: true,
            allowUnknownBody: true,
            allowUnknownQuery: true,
            allowUnknownParams: true,
            status: 400,
            statusText: 'Bad Request'
        });

        pushErrors(errors, validate(errors, req.headers, schema.headers, 'headers', options.allowUnknownHeaders));
        pushErrors(errors, validate(errors, req.body, schema.body, 'body', options.allowUnknownBody));
        pushErrors(errors, validate(errors, req.query, schema.query, 'query', options.allowUnknownQuery));
        pushErrors(errors, validate(errors, _.extend({}, req.params), schema.params, 'params', options.allowUnknownParams));

        if (errors && errors.length === 0) {
            return next();
        }

        next(new ValidationError(errors, options));
    };
};

var validation = module.exports = validate;
validation.ValidationError = ValidationError;
