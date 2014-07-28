var level = require('level-test')();
var lock = require('../');
var test = require('tape');
var bytewise = require('bytewise');

test('user add bytewise', function (t) {
    t.plan(8);
    
    var dbfile = 'level-lock-useradd-' + Math.random();
    var db = level(dbfile, {
        keyEncoding: bytewise,
        valueEncoding: 'json'
    });
    
    createAll(function (err) {
        t.ifError(err);
        createAll(function (err) {
            t.equal(err, 'exists');
        });
    });
    
    function createAll (cb) {
        for (var i = 0; i < 4; i++) (function (i) {
            var data = { bio: 'beep boop ' + i };
            create([ 'user', 'robot' ], data, function (err) {
                if (i === 0) {
                    cb(err);
                }
                else t.equal(err, 'locked');
            });
        })(i);
    }
    
    function create (key, data, cb) {
        var unlock = lock(db, key, 'w');
        if (!unlock) return cb('locked');
        
        db.get(key, function (err, value) {
            if (value) return cb('exists');
            
            db.put(key, data, function (err) {
                unlock();
                return cb(err);
            });
        });
    }
});
