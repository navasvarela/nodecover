var fs = require('fs');
var fsutils = require('./fsutils');
var winston = require('winston');
var path = require('path');
var reporter = require('./reporter');
var testrunner = require('nodeunit').reporters.default;
fsutils.initLog();
winston.add(winston.transports.File, { level: 'debug', filename: path.normalize(__dirname+'/../log/ncover.log'), timestamp: true, colorize: true});
global.Stats = {};
var source_regex = /[a-zA-z]/;
var function_regex = /\bfunction/;

var lineCovered = function(module,line) {
	winston.debug(__filename+': lineCovered('+module+','+line+')');
	if (global.Stats[module] && global.Stats[module].lines.hit.indexOf(line) < 0) {
		global.Stats[module].lines.hit.push(line);
	}
	winston.debug(__filename+':'+ JSON.stringify(global.Stats));
};

var functionCovered = function(module,line) {
	winston.debug(__filename+': functionCovered('+module+','+line+')');
	if (global.Stats[module] && global.Stats[module].functions.hit.indexOf(line) < 0) {
		global.Stats[module].functions.hit.push(line);
	}
}; 

var processFunction = function(module,line, lineNumber,totalFunctions) {
    winston.debug(__filename+': processFunction('+line+','+lineNumber+','+totalFunctions);	
	if (function_regex.test(line)) {
		totalFunctions++;
	    line = line + 'ncover.functionCovered(\''+module+'\','+lineNumber+');';	
	}	
	return [totalFunctions, line];
};

var processLines = function(module) {
    var _totalLines = 0, _sourceLines = 0, _totalFunctions = 0;
	var modified_lines = [], bigLine;
	
	bigLine = 'console.log(\'Using instrumented module file: '+module+'\');var ncover = require(\'nodecover\');\n';
	fs.readFileSync(module+'.bak').toString().split('\n').forEach(function(line) {
		_totalLines++;
		line = fsutils.trimString(line);
		if (line.charAt(line.length - 1) === ';' && source_regex.test(line)) {
			_sourceLines++;
			if (line.indexOf('return') >= 0) {
				line = ' ncover.lineCovered(\''+module+'\','+_totalLines+');'+ line;
			} else {
				line = line + ' ncover.lineCovered(\''+module+'\','+_totalLines+');';
			}
		}
		
		functionLines = processFunction(module,line,_totalLines, _totalFunctions);
		console.log('functionLines: '+functionLines);
		_totalFunctions = functionLines[0];
		line = functionLines[1];
		line = line + '\n';
		modified_lines.push(line);

	});
	modified_lines.forEach(function(line) {
		console.log("Writing to file: "+module+".mod, line: "+line);
		bigLine = bigLine + line;
	});
	
	fs.writeFileSync(module+'.mod',bigLine); 
	fsutils.copyFile(module+'.mod', module, null);
	var fileStats = { lines: { total: _totalLines, source: _sourceLines, hit: [] }, functions: { total: _totalFunctions, hit: []}};
	global.Stats[module] = fileStats;
};


var refreshModule = function(moduleName) {
	delete require.cache[moduleName];
};

exports.Stats = Stats;
exports.lineCovered = lineCovered;
exports.functionCovered = functionCovered;

var parseModule = function(module) {
	console.log('parsing module: '+module);
    var tmp_module_file = module + '.bak';
	try {
		fs.unlinkSync(tmp_module_file);
	} catch(e) {
	}
	fsutils.copyFile(module, tmp_module_file, function(error) {
		if (error) {throw error;}
	});
		console.log('Instrumenting file: '+module);
		processLines(module, module);
		refreshModule(module);
};

var report = function() {
	reporter.printTxtReport();
};

var processDir = function(dir) {
	var listOfFiles = [];
	fs.readdirSync().forEach(function(file) {
		file = dir + '/' + file;
		fs.stat(file, function(err, stat) {
		if (stat && stat.isDirectory()) {
			processDir(file);
		} else {
			parseModule(file);
			listOfFiles.push(file);
		}
		});
	});
	return listOfFiles;
};

var restoreFiles = function(files) {
	files.forEach(function(file) {
		winston.debug('Restoring file: '+file);
		fsutils.copyFile(file+ '.bak', file, function(e) { if (e) {throw e;}});
	});
};

exports.process = function(dirList,testDirs) {
	var listOfFiles = [];
	var stat;
	for (i=0;i<dirList.length;i++) {
		try {
			stat = fs.statSync(dirList[i]);
		} catch (e) {
			throw e;
		}
		if (stat.isFile()) {
			parseModule(dirList[i]);
			listOfFiles.push(dirList[i]);
		} else if (stat.isDirectory()){
			listOfFiles.concat(processDir(dirList[i]));
		}
	}
	testrunner.run(testDirs);
	restoreFiles(listOfFiles);
	report();
};

