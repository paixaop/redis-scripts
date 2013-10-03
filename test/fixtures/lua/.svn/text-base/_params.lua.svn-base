local out = {}
for i=1, #KEYS do
    out[i] = 'Key ' .. i .. ': ' .. KEYS[i]
    local type = redis.call('type', KEYS[i])
    redis.log(redis.LOG_WARNING, KEYS[1] .. ' is a ' .. type.ok)
end
for i=1, #ARGV do
    out[i+#KEYS] = 'Arg ' .. i .. ': ' .. ARGV[i]
end
return out
