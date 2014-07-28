var level = require('level');
var db = level('/tmp/users.db', { valueEncoding: 'json' });
var lock = require('../');

var username = process.argv[2];
var key = 'users!' + username;
var userdata = { bio: 'beep boop' };

var unlock = lock(db, key, 'w');
if (!unlock) return exit(1, 'locked');
 
db.get(key, function (err, value) {
    if (value) {
        unlock();
        return exit(1, 'that username already exists');
    }
    
    db.put('users!substack', userdata, function (err) {
        unlock();
        if (err) return exit(1, err);
        console.log('created user ' + username);
    });
});

function exit (code, err) {
    console.error(err);
    process.exit(code);
}
