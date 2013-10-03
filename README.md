# RedisScripts

Script manager module for Redis Lua script functionality.

## Install

Simple installation with NPM

    npm install redis-scripts


## Usage

    var redis = require("redis"),
    	ScriptManager = require("redis-scripts"),
        client = redis.createClient();

    client.on("error", function (err) {
        console.log("Error " + err);
    });

    client.on("ready", function (err) {
		var sm = new ScriptManager(client);

		// Load all Lua scripts in a directory into Redis
		sm.loadScriptsFromDirectory("./lua", function (err) {
             if (err) {
                console.log("Error " + err);
                process.exit(1);
             }

             // If your directory included a script called incrbyone.lua
             // you can now call it directly from the ScriptManager object
             sm.incrbyone('key');
        });
    });


## API

## scriptManager.load(command, scriptFile, callback)

Load a file containing a Lua script into Redis and create a new command in the script manager object.
With the support for Lua server side scripting, and the fact that Lua scripts
run atomically, as any native command would, we can easily add new behavior to Redis.
Once loaded the scripts are cached in the server and do not need to be reloaded again,
You can expect this to be true until a `SCRIPT FLUSH` command is issued.

If a script is not found on the server you will receive a `NOSCRIPT` error message, and
need to call `scriptManager.load()` again.
Suggestion is to use your script loading code in the Redis client "ready" event handler. This way whenever you reconnect to Redis the scripts will be reloaded.

Parameters:

* `command` name of the command that will be registered in the client
* `scriptFile` name of the file containing the script. If no extension is given `.lua` is used.
* `callback` optional callback

For more details on passing arguments to scripts and other important details about
Lua scripting in general read the Redis EVAL command page at http://redis.io/commands/eval

After the script has been loaded you can call it as any native command, by using

    scriptManager.command(key1, key2, ..., [callback]);

For example, imagine you need to implement a conditional increment command without
using MULTI/EXEC/WATCH. Create a file called `cincr.lua` with the following content:

    -- Conditional Increment
    -- Increment Key if value is bigger than ARGV[1]
    local value = tonumber(redis.call('get',KEYS[1]))
    if value == nil then return {err="Value at key is not integer"} end
    if value > tonumber(ARGV[1]) then
        value = value + 1
        redis.call('set',KEYS[1],value)
    end
    return value

Now from your application call:

    scriptManager.Load('cincr', './cincr', 1, function(err, reply) {
        if( err ) {
            console.log( err );
            process.exit();
        }

        scriptManager.cincr('key1', 10, function (err, reply) {
            console.log(reply);
            process.exit();
        });
    });

The load process will determine the number of Redis Keys your script needs by analysing the number of elements in the KEYS lua table.

## scriptManager.getNumberOfKeys(command)
Return the number of Redis Keys the `command` script needs to run properly.
If command does not exist, returns `-1`.

## scriptManager.calcNumberOfKeys(code)
Calculate the number of Redis Keys the passed Lua source code needs to run properly.
Returns the number of keys the script needs.

## scriptManager.loadScriptsFromDirectory(path, next)
Load all Lua scripts found in `path` into Redis. Scripts that start with `_` or `.` are ignored.
Scripts must have a `.lua` extension.

# Testing
Tests require Node mocha and instanbul modules to be installed globaly.

    npm install mocha istanbul -g

Tests need to connect to a Redis server. By default it tries to connect to localhost:6376.
So you must have a running Redis server or the tests will fail.

To run all module tests simply run:

    npm test

or

    make test

To obtain a test coverage report run

    npm cover

#License

MIT License
