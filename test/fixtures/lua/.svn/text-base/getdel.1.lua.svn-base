-- Usage
--  GETDEL key
--
-- Parameters
--      Key           - string key
--      expectedValue - value that you application expects to be stored in key
--
-- Operation performed
--      Get the value of the key. If expected and stored values are the same
--      delete the key.
--
-- Returns
--      value of key
--      error if key does not exist
--
-- Author: Pedro Paixao
local cmd = 'GETDEL'

-- Test parameters
if #KEYS ~= 1 then
    return { err = "Err '" .. cmd .. "' command needs one key. Got " .. #KEYS }
end
if #ARGV ~= 1 then
    return { err = "ERR wrong number of arguments for '" .. cmd ..
                   "' command. Usage: " .. cmd.. " key expectedValue" }
end

local key = KEYS[1]
local expected = ARGV[1]

-- Test for none in case the key does not exist
local type = redis.call('type', key)
if type.ok == 'none' then
    return { err = key .. ' does not exist.' }
end

if type.ok ~= 'string' then
    return { err = key .. ' must be a string.' }
end

-- Get the value
local value = redis.call('get', key)
if value == expected then
    -- Delete the key
    -- Only delete the key if the value matches what the caller expected
    -- to avoid denial of service attacks where by brute forcing the keys
    -- someone could delete them and impact other users.
    redis.call('del', key)
else
    return { err = "Unexpected value" }
end

-- Nothing more to do...
return value

