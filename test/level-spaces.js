var level = require('level-test')();
var spaces = require('level-spaces');
var lock = require('../');
var test = require('tape');

test('level-spaces', function (t) {
	t.plan(24);
	
	var dbfile = 'level-lock-spaces-' + Math.random();
	var db = level(dbfile);
	var space1 = spaces(db, 'space-one');
	var space2 = spaces(db, 'space-two');

	createSet(db, function () {
		createSet(space1, function () {
			createSet(space2);
		});
	});

	function createSet (db, cb) {
		createAll(db, function (err) {
			t.ifError(err);
			createAll(db, function (err) {
				t.equal(err, 'exists');
				cb && cb();
			});
		});
	}
	
	function createAll (db, cb) {
		for (var i = 0; i < 4; i++) (function (i) {
			var data = 'beep boop ' + i
			create(db, 'robot', data, function (err) {
				if (i === 0) {
					cb(err);
				}
				else t.equal(err, 'locked');
			});
		})(i);
	}
	
	function create (db, key, data, cb) {
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
