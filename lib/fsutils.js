var fs = require('fs');
var path = require('path');
var sys = require('util');
var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.File, { level: 'info', filename: path.normalize(__dirname+'/../log/ncover.log'), timestamp: true, colorize: true});
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

exports.trimString = function(str) {
	winston.debug(__filename+': trimString('+str+')');
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
