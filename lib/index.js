'use strict';

var assert = require('assert'),
    thing = require('core-util-is'),
    path = require('path'),
    caller = require('caller'),
    restifyroutes = require('./restifyroutes'),
    url = require('url'),
    routes = require('swaggerize-routes'),
    yaml = require('js-yaml'),
    fs = require('fs');

function swaggerize(server, options) {
    assert.ok(thing.isObject(options), 'Expected options to be an object.');
    assert.ok(options.api, 'Expected an api definition.');

    if (thing.isString(options.api)) {
        options.api = loadApi(options.api);
    }

    assert.ok(thing.isObject(options.api), 'Api definition must resolve to an object.');

    options.basedir = options.basedir || path.dirname(caller());

    options.routes = routes(options);

    mount(server, options);
}

/**
 * Onmount handler.
 * @param options
 * @returns {onmount}
 */
function mount(server, options) {
    Object.defineProperty(server, 'swagger', {
      configurable: true,
      writable: true,
        value: {
            api: options.api,
            routes: options.routes
        }
    });

    restifyroutes(server, options);
}

/**
 * Loads the api from a path, with support for yaml..
 * @param apiPath
 * @returns {Object}
 */
function loadApi(apiPath) {
    if (apiPath.indexOf('.yaml') === apiPath.length - 5 || apiPath.indexOf('.yml') === apiPath.length - 4) {
        return yaml.load(fs.readFileSync(apiPath));
    }
    return require(apiPath);
}

module.exports = swaggerize;
