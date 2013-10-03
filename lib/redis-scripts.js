/*
 * Redis Scripts: Run LUA scrits on you Redis database
 * transparently
 *
 * Pedro Paixao
 * 1/20/2013
 *
 * $Id: redis-scripts.js 815 2013-10-01 14:27:10Z pedro $
 */

var redis = require('redis')
    should = require('should'),
    fs = require("fs");

var RedisScripts = module.exports = function(redisClient) {
    var self = this;

    redisClient.should.be.a('object');

    // Hold Lua state - number of keys parameters and script SHA1 sums
    this.lua = {};

    self.redis = redisClient;

    // Load lua script to Redis one and set up the client command
    self.load = function(command, scriptFile, done) {

        if (!self.redis) {
            done(new Error("Please call setClient(redisClient) with a valid redis client before loading scripts"));
        }

        // If file extension not given add .lua
        if (!scriptFile.match(/\.\w+$/)) {
            scriptFile += '.lua';
        }

        // Read Lua script file
        fs.readFile(scriptFile, 'utf8', function(err, script) {
            if (err) {
                if (typeof done === 'function') {
                    done(err);
                }
                return;
            }

            if (typeof self.lua[command] === 'undefined') {
                self.lua[command] = {};
            }


            // Store the number of keys the script expects to process
            self.lua[command].nKeys = self.calcNumberOfKeys(script);

            // Store the script in the Redis Script Cache and get the SHA1 signature
            // So we can call evalsha and use multi without concerns for missing scripts
            self.redis.send_command('SCRIPT', ['LOAD', script], function(err, reply) {
                if (err) {
                    if (typeof done === 'function') {
                        done(err);
                    }
                    return;
                }

                if (typeof reply !== 'string') {
                    throw "SCRIPT LOAD should return a SHA1 sum of the Lua script.";
                }

                // Store the SHA1 from the script load command
                self.lua[command].sha1 = reply;

                if (exports.debug_mode) {
                    console.log(command + ' ready. (SHA1:' + reply + ')');
                }

                // Add the new command to the redis client object
                RedisScripts.prototype[command] = function() {
                    var args = [];

                    // Convert arguments to an array object
                    for (var i = 0; i < arguments.length; i += 1) {
                        args[i] = arguments[i];
                    }

                    // Get the last argument to check if it is a callback function
                    var callback = args[args.length - 1];

                    if (typeof callback === 'function') {
                        args.pop();
                    } else {
                        // Just in case things fail and caller did not
                        // give us a callback to hangle it
                        callback = function(err) {
                            if (err) {
                                throw err;
                            }
                        };
                    }

                    args = [self.lua[command].sha1, self.lua[command].nKeys].concat(args);

                    return self.redis.send_command('evalsha', args, callback);
                };

                RedisScripts.prototype[command.toUpperCase()] = RedisScripts.prototype[command];

                if (typeof done === 'function') {
                    done();
                }
            });
        });
    };

    /**
     * Get the number of keys a command expects
     *
     * @param command {string}  command name
     * @return {number} number of keys
     */
    self.getNumberOfKeys = function (command) {
        command.should.be.a('string');

        if (self.lua.length === 0) {
            return -1;
        }

        if (typeof self.lua[command] !== 'undefined') {
            return self.lua[command].nKeys;
        }

        return -1;
    }

    // get number of keys needed by script
    self.calcNumberOfKeys = 	function (luaCode) {
		var reKeys = /KEYS\[\s*(\d+)\s*\]/g
		,	match
		,	max = 0, d = 1000;
		while ((match = reKeys.exec(luaCode)) && d > 0) {
			if (parseInt(match[1], 10) > max)
				max = parseInt(match[1], 10);
			d--;
		}
		return max;
	}

    /**
     * Read all the Lua scripts from a directory, that do not start with an
     * '_' or '.' character, and a number followed by the '.lua' extension.
     *
     * example: incr.lua
     *
     * @params path {String} a directory
     * @params next {function} a callback function with an error parameter
     */

    self.loadScriptsFromDirectory = function(path, next) {
        var luaFileRegExp = new RegExp(/^([^_.]\w+)\.lua$/);

        path.should.be.a('string');
        next.should.be.a('function');

        fs.readdir(path, function(err, files) {
            if (err) {
                next(err);
                return;
            }

            var numberOfScripts = 0;
            var scriptsReadSuccesfuly = 0;
            var tOut = 0;

            for (var i = 0; i < files.length; i++) {
                var m = luaFileRegExp.exec(files[i]);
                if (m) {

                    var fileName = m[0];
                    var command = m[1];

                    numberOfScripts++;
                    try {

                        self.load(
                            command, path + '/' + fileName, function(err) {
                                if (err) {
                                    if (tOut) {
                                        clearTimeout(tOut);
                                    }
                                    numberOfScripts = scriptsReadSuccesfuly = 0;
                                    next(err);
                                }
                                scriptsReadSuccesfuly++;
                        });

                    } catch (err) {
                        if (tOut) {
                            clearTimeout(tOut);
                        }
                        numberOfScripts = scriptsReadSuccesfuly = 0;
                        next(err);
                        return;
                    }
                }
            }

            var tOut = setTimeout(waitForAllScriptsToRead, 200);

            function waitForAllScriptsToRead() {
                if (scriptsReadSuccesfuly != numberOfScripts) {
                    setTimeout(waitForAllScriptsToRead, 200);
                }
                next();
                return;
            }

        });

    }

}
