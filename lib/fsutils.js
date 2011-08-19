var async = require('async'),
     fs = require('fs');
var path = require('path');
var sys = require('util');
var winston = require('winston');

var createDir = function(dir) {
	var lstat = null;
	try {
		lstat = fs.lstatSync(dir);
	} catch(e) {
		winston.debug(__filename+':createDir() '+dir+' does not exist');
	}
    if (lstat === null || !lstat.isDirectory()) {
		fs.mkdirSync(dir, '0755');
	}
};
exports.modulePaths = function (paths, callback) {
    async.concat(paths, function (p, cb) {
        fs.stat(p, function (err, stats) {
            if (err) {
                return cb(err);
            } else {
				console.log('Looking at file: '+p);
			}
            if (stats.isFile()) {
                return cb(null, [p]);
            } 
            if (stats.isDirectory()) {
                fs.readdir(p, function (err, files) {
                    if (err) {
                        return cb(err);
                    }

                    // filter out any filenames with unsupported extensions
                    var modules = files.filter(function (filename) {
                        return extensionPattern.exec(filename);
                    });

                    // remove extension from module name and prepend the
                    // directory path
                    var fullpaths = modules.map(function (filename) {
                        var mod_name = filename.replace(extensionPattern, '');
                        return [p, mod_name].join('/');
                    });

                    // sort filenames here, because Array.map changes order
                    fullpaths.sort();

                    cb(null, fullpaths);
                });
            }
        });
    }, callback);
};


exports.trimString = function(str) {
	console.log('trimString('+str+')');
	return str.replace(/^\s+|\s+$/g, '');
};

exports.initLog = function() {
	var logDir = path.normalize(__dirname + '/../log');
	createDir(logDir);
};

exports.createDir = createDir;

exports.copyFile = function(from,to) {
	 fs.writeFileSync(to, fs.readFileSync(from));
};


exports.getLineInFile = function(filename) {
	winston.debug(__filename+': getLineInFile('+filename+')');
	try {
		throw new Error();
	} catch(e) {
		var stacklines = e.stack.split('\n');
        for (i = 0; i < stacklines.length; i++) {
			if (stacklines[i].indexOf(filename) >= 0) {
				var line = stacklines[i].split(':')[1];
				return line;
			}
		}

	}
};
