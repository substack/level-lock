# level-lock

in-memory advisory read/write locks for leveldb keys

# example

A very common use-case for locking is to prevent race conditions when checking
to see if a username has been taken.

In a naive solution, a `get()` followed by a `put()` runs the risk that 2
requests might come in at roughly the same time and that both calls to `get()`
could finish before either call to `put()`, resulting in 2 calls to `put()` and
leaving the database in an inconsistent state.

However, if we obtain a write lock on a key before checking for the existence of
that key with `get()` and then only release the lock after the `put()` has
completed, the sequence of operations can be safely performed.

Here is an example:

``` js
var level = require('level');
var db = level('/tmp/users.db', { valueEncoding: 'json' });
var lock = require('level-lock');

var username = process.argv[2];
var key = 'users!' + username;
var userdata = { bio: 'beep boop' };

var unlock = lock(db, key, 'w');
if (!unlock) return exit(1, 'locked');
 
db.get(key, function (err, value) {
    if (value) return exit(1, 'that username already exists');
    
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
```

To drive the point further home, here is code that concretely demonstrates the
problem:

``` js
var level = require('level');
var db = level('/tmp/race.db', { valueEncoding: 'json' });
var lock = require('level-lock');

var name = process.argv[2];
var data = { bio: 'beep boop' };

for (var i = 0; i < 3; i++) (function (i) {
    create(name, data, function (err) {
        console.error(i + ' create: ' + (err || 'ok'));
    });
})(i);

function create (name, data, cb) {
    var key = 'users!' + name;
    
    //var unlock = lock(db, key, 'w');
    //if (!unlock) return cb(new Error('locked'));
    
    db.get(key, function (err, value) {
        if (value) return cb(new Error('that username already exists'));
        
        db.put('users!substack', data, function (err) {
            //unlock();
            cb(err);
        });
    });
}
```

If we run this program, then the user substack is created 3 separate times,
subverting our check to see if a username already exists:

```
$ node race.js substack
0 create: ok
1 create: ok
2 create: ok
```

However, if the locking code is un-commented, then a user is only created once:

```
$ node race.js substack
1 create: Error: locked
2 create: Error: locked
0 create: ok
```

Note however that just like the unix system call `flock(2)`, these locks are
merely advisory so code that does not check for locks can still cause
consistency problems.

# methods

``` js
var lock = require('level-lock')
```

## lock(db, key, mode='w')

Create a lock on a `key` with a `mode`.

`mode` can be `'r'`, `'w'`, or `'rw'`.

The `keyEncoding` of `db` will be respected when setting a lock on a key.

Locks are stored in-memory on the `db` object under `db._locks`.

# install

With [npm](https://npmjs.org) do:

```
npm install level-lock
```

# license

MIT
