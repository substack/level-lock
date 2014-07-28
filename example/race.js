var level = require('level');
var db = level('/tmp/race.db', { valueEncoding: 'json' });
var lock = require('../');

var name = process.argv[2];
var data = { bio: 'beep boop' };

for (var i = 0; i < 3; i++) (function (i) {
    create(name, data, function (err) {
        console.error(i + ' create: ' + (err || 'ok'));
    });
})(i);

function create (name, data, cb) {
    var key = 'users!' + name;
    
    var unlock = lock(db, key, 'w');
    if (!unlock) return cb(new Error('locked'));
    
    db.get(key, function (err, value) {
        if (value) return cb(new Error('that username already exists'));
        
        db.put('users!substack', data, function (err) {
            unlock();
            cb(err);
        });
    });
}
