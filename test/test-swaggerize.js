'use strict';

var test = require('tape'),
    swaggerize = require('../lib'),
    restify = require('restify'),
    request = require('supertest'),
    path = require('path');

test('swaggerize', function (t) {

    var server = restify.createServer();
    var server2 = restify.createServer();

    server.use(restify.bodyParser());

    swaggerize(server, {
        api: require('./fixtures/defs/pets.json'),
        handlers: path.join(__dirname, 'fixtures/handlers')
    });


    t.test('api', function (t) {
        t.plan(6);

        t.ok(server.hasOwnProperty('swagger'), 'app has swagger property.');
        t.ok(server.swagger, 'swagger is an object.');

        t.ok(server.swagger.hasOwnProperty('api'), 'app.swagger has api property.');
        t.ok(server.swagger.api, 'app.swagger.api is an object.');

        t.ok(server.swagger.hasOwnProperty('routes'), 'app.swagger has routes property.');
        t.ok(server.swagger.routes, 'app.swagger.routes is an object.');
    });

    t.test('api as path', function (t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize(server2, {
                api: path.join(__dirname, './fixtures/defs/pets.json'),
                handlers: path.join(__dirname, 'fixtures/handlers')
            });
        });
    });

    t.test('docs', function (t) {
        t.plan(2);

        request(server).get('/v1/petstore/api-docs').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
        });
    });

    t.test('post /pets', function (t) {
        t.plan(3);

        request(server).post('/v1/petstore/pets').send({id: 0, name: 'Cat'}).end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
            t.strictEqual(response.body.name, 'Cat', 'body is correct.');
        });
    });

    t.test('get /pets', function (t) {
        t.plan(3);

        request(server).get('/v1/petstore/pets').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
            t.strictEqual(response.body.length, 1, 'body is correct.');
        });
    });

    t.test('get /pets/:id', function (t) {
        t.plan(3);

        request(server).get('/v1/petstore/pets/0').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
            t.strictEqual(response.body.name, 'Cat', 'body is correct.');
        });
    });

    t.test('delete /pets', function (t) {
        t.plan(3);

        request(server).delete('/v1/petstore/pets/0').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
            t.strictEqual(response.body.length, 0, 'body is correct.');
        });
    });

});

test('input validation', function (t) {

    var server = restify.createServer();

    server.use(restify.bodyParser());
    server.use(restify.queryParser());

    swaggerize(server, {
        api: require('./fixtures/defs/pets.json'),
        handlers: {
            'pets': {
                '{id}': {
                    $get: function (req, res) {

                    },
                    $delete: function (req, res) {
                        res.send(typeof req.body);
                    }
                },
                $get: function (req, res) {
                    res.json({
                        id: 0,
                        name: 'Cat',
                        tags: req.query['tags']
                    });
                },
                $post: function (req, res) {
                    res.send(typeof req.body);
                }
            }
        }
    });

    t.test('good query', function (t) {
        t.plan(3);

        request(server).get('/v1/petstore/pets?tags=kitty&tags=serious').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
            t.strictEqual(response.body.tags.length, 2, 'query parsed.');
        });
    });

    t.test('missing body', function (t) {
        t.plan(2);

        request(server).post('/v1/petstore/pets').send('').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 400, '400 status.');
        });
    });

});

test('yaml support', function (t) {
    var server = restify.createServer();

    t.test('api as yaml', function (t) {
        t.plan(1);

        t.doesNotThrow(function () {
            swaggerize(server, {
                api: path.join(__dirname, './fixtures/defs/pets.yaml'),
                handlers: path.join(__dirname, 'fixtures/handlers')
            });
        });
    });

    t.test('get /pets', function (t) {
        t.plan(2);

        request(server).get('/v1/petstore/pets').end(function (error, response) {
            t.ok(!error, 'no error.');
            t.strictEqual(response.statusCode, 200, '200 status.');
        });
    });

});
