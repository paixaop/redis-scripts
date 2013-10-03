
var RedisScripts = require('../../redis-scripts');
var redis = require('redis');
var scriptManager;

var server =
        { 'host': '127.0.0.1', 'port' : 6379, 'options' : {} };

// Connect to the databse
var client;

describe("connect", function() {
    //this.timeout(0);

    before(function(done) {
        client = redis.createClient(server.port, server.host, server.options);

        client.on("error", function(err) {
            should.fail();
        });

        client.on("ready", function (err) {
            done();
        });
    });

    describe('Init object', function() {
        it('should fail when not given a valid redis client', function (done) {
            (function() {
                scriptManager = new RedisScripts();
            }).should.throw();
            done();
        });

        it('should fail when not given a valid redis client', function (done) {
            (function() {
                scriptManager = new RedisScripts("123");
            }).should.throw();
            done();
        });

        it('should not fail with valid redis client', function (done) {
            (function() {
                scriptManager = new RedisScripts(client);
            }).should.not.throw();
            done();
        });

    });

    describe('Test Script loading', function() {
        it('should fail if path not string', function(done) {

            (function() {
                scriptManager.loadScriptsFromDirectory(123,function (err) {

                });
            }).should.throw();
            done();

        });

        it('should fail if next() not function', function(done) {

            (function() {
                scriptManager.loadScriptsFromDirectory("123",123);
            }).should.throw();
            done();

        });

        it('should fail if path does not exist in file system', function(done) {

            scriptManager.loadScriptsFromDirectory("123Cvd1233", function (err) {
                if (err) {
                    done();
                }
                should.fail;
            });

        });

        it('should fail if path does not exist in file system', function(done) {

            scriptManager.loadScriptsFromDirectory("123Cvd1233", function (err) {
                if (err) {
                    done();
                }
                should.fail;
            });

        });

        it('should error on bad scripts', function(done) {

            scriptManager.loadScriptsFromDirectory("./test/fixtures/luabad", function (err) {
                if (err) {
                    done();
                }
                should.fail;
            });

        });

        it('should load good scripts', function(done) {

            scriptManager.loadScriptsFromDirectory("./test/fixtures/lua", function (err) {
                if (err) {
                    should.fail;
                }

                // Check if the scripts loaded
                scriptManager.should.have.property('getdel').be.a('function');

                scriptManager.should.have.property('nokey').be.a('function');
                scriptManager.should.not.have.property('_params');

                done();
            });

        });

        it('should calculate the right number of keys', function(done) {
            scriptManager.getNumberOfKeys('getdel').should.eql(1);
            scriptManager.getNumberOfKeys('nokey').should.eql(0);
            done();
        });

        it('should run script and return ok', function(done) {
            scriptManager.nokey(function(err, str) {
                if (err) {
                    should.fail;
                }
                str.should.eql('OK');
                done();
            });
        });

    });
});
