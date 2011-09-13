var fs = require('fs');
var path = require('path');
var sys = require('util');
var winston = require('winston');
var logger;
var configureLogging = function() {
	if (logger !== undefined) {
		logger.remove(winston.transports.Console);
	} else {
		logger = new winston.Logger();
		logger.add(winston.transports.Console, { level: 'info', silent: true});
	}
	logger.info('Logging Configured');
};

configureLogging();
exports.logger = logger;

var excludedDirs = ['.git', '.svn'];

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

var isExcludedDir = function(dirName){
	var result = false;
	excludedDirs.forEach(function(excludedDir) {
		if (dirName.indexOf(excludedDir) >= 0) {
			result = true;
			
		}
	});
	return result;
};

var getListOfFiles = function(dir,regex,listOfFiles) {
	var i = 0, file, stat;
	var dirFiles = fs.readdirSync(dir);
	if (!listOfFiles) {
		listOfFiles = [];
	}
	for (i = 0; i < dirFiles.length; i++) {
		file = dirFiles[i];
		file = path.resolve(dir + '/' + file);
		stat = fs.statSync(file);
		if (stat && stat.isDirectory() && !isExcludedDir(file)) {
			listOfFiles.concat(getListOfFiles(file, regex, listOfFiles));
		} else if (stat) {
			if (stat.isFile() && regex.test(file)) {
				listOfFiles.push(file);
			}
		}
		
	}
	return listOfFiles;
};

exports.getListOfFiles = getListOfFiles;
