module.exports = function (db, key, mode) {
    if (!db._locks) db._locks = {};
    if (!db._locks.read) db._locks.read = {};
    if (!db._locks.write) db._locks.write = {};
    
    var ekey = typeof db.options.keyEncoding === 'object'
    && db.options.keyEncoding.encode
        ? db.options.keyEncoding.encode(key)
        : key
    ;
    
    if (!mode) mode = 'w';
    
    if (typeof mode === 'object') {
        mode = [
            (mode.read ? 'r' : ''),
            (mode.write ? 'w' : '')
        ].join('');
    }
    mode = String(mode).split('').sort().join('');
    if (/[^rw]/.test(mode)) {
        throw new Error('unknown mode: ' + mode);
    }
    
    if (/r/.test(mode) && db._locks.read[ekey]) return null;
    if (/w/.test(mode) && db._locks.write[ekey]) return null;
    
    if (/r/.test(mode)) db._locks.read[ekey] = true;
    if (/w/.test(mode)) db._locks.write[ekey] = true;
    
    return function () {
        if (/r/.test(mode)) {
            delete db._locks.read[ekey];
        }
        if (/w/.test(mode)) {
            delete db._locks.write[ekey];
        }
    };
};
