var fs = require('fs');
var vm = require('vm');
var fsutils = require('./fsutils');
var winston = require('winston');
var cleaner = require('./cleaner');
var path = require('path');
var reporter = require('./reporter');
var testrunner = require('./nodecover_testrunner');
fsutils.initLog();
var Stats = {};
global.Stats = Stats;
var source_regex = /[a-zA-z]/;
var function_regex = /\bfunction\b/;
var js_regex = /\.js$/;
var if_regex = /\bif\b/;

var lineCovered = function(module,line) {
	if (Stats[module] && Stats[module].lines.hit.indexOf(line) < 0) {
		Stats[module].lines.hit.push(line);
	}
};

var functionCovered = function(module,line) {
	if (Stats[module] && Stats[module].functions.hit.indexOf(line) < 0) {
		Stats[module].functions.hit.push(line);
	}
}; 

var blockCovered = function(module,line) {
	if (Stats[module] && Stats[module].blocks.hit.indexOf(line) < 0) {
		Stats[module].blocks.hit.push(line);
	}
}; 
var processFunction = function(module,line, lineNumber,totalFunctions) {
	var resultLine = ''; var index = 0;
	if (function_regex.test(line)) {
		totalFunctions++;
		index = line.indexOf('function') ;
		index = line.indexOf('{',index);
		if (module.indexOf('id.js') > 0) {
			console.log('index: '+index);
		}
		resultLine = line.substring(0, index+1);
	    resultLine +=  'ncover.functionCovered(\''+module+'\','+lineNumber+');';
		resultLine += line.substring(index+1);	
	} else {
		resultLine = line;
	}	
	return [totalFunctions, resultLine];
};

var processBlock = function(module,all_lines, line, lineNumber,totalBlocks) {
	var result = '', fragments, index = 0, in_string=false, in_string_double=false;
	var init_index = 0;	
	if (cleaner.isAnObject(lineNumber,all_lines)) {
		if (line.indexOf('}') > 0 && (line.indexOf('}') > line.indexOf(':'))) {
			init_index = line.indexOf('}') + 1;
		}
	}
	if (line.indexOf('{',index) >= 0 && line.indexOf('return') < 0 && (!cleaner.isAnObject(lineNumber,all_lines) || function_regex.test(line))) {
		result = line.substring(0,init_index);
		if (module.indexOf('bootstrapmgr') > 0) {
			console.log('lineNum: '+lineNumber+', line: '+line+', isAnObject: '+cleaner.isAnObject(lineNumber,all_lines)+', result: '+result);
		}
		fragments = line.substring(init_index).split('{');
		fragments.forEach(function(fragment) {
			index++;
			result += fragment ;
			fragment = fsutils.trimString(fragment);
			if (fragment.indexOf('\'') >= 0) {
				in_string = (fragment.match(/'/g).length % 2) && !in_string ;
			}
			if (fragment.indexOf('"') >= 0) {
				in_string_double = (fragment.match(/"/g).length % 2) && !in_string_double;
			}
			if (index < fragments.length && !in_string && !in_string_double) {
				if (fragment.charAt(fragment.length - 1) !== '=') {
					result += '{ ncover.blockCovered(\''+module+'\','+lineNumber+');';
					totalBlocks++;
				} else {
					result += ' {';
				}
			}
		});
		line = result === ''? line : result;
	}
	return [totalBlocks,line];
};

var processLines = function(module) {
	winston.debug('Processing lines for module: '+module);
    var _totalLines = 0, _sourceLines = 0, _totalFunctions = 0, _totalBlocks = 0;
	var modified_lines = [], bigLine;
	var slines =[], all_lines = [];
	all_lines = fs.readFileSync(module+'.bak').toString().split('\n');
	all_lines = cleaner.clean(all_lines);
	all_lines.forEach(function(line) {
		bigLine += line + '\n';
	});
	fs.writeFileSync(module+'.clean',bigLine);
	all_lines.forEach(function(line) {
		_totalLines++;
		if (line.indexOf('//') >= 0) {
			line = line.substring(0, line.indexOf('//'));
		}
		line = fsutils.trimString(line);
		if (line.length > 0 && line.charAt(line.length - 1) === ';' && source_regex.test(line)) {
			_sourceLines++;
			slines.push(_totalLines);
			if (line.indexOf('return') >= 0) {
				line = ' ncover.lineCovered(\''+module+'\','+_totalLines+');'+ line;
			} else {
				line = line + ' ncover.lineCovered(\''+module+'\','+_totalLines+');';
			}
		}
		
		functionLines = processFunction(module,line,_totalLines, _totalFunctions);
		blockLines = processBlock(module,all_lines,functionLines[1], _totalLines, _totalBlocks);
		_totalFunctions = functionLines[0];
		_totalBlocks = blockLines[0];
		line = blockLines[1];
		line = line + '\n';
		modified_lines.push(line);

	});
	winston.debug('Processed lines: '+modified_lines.length);
	bigLine = 'console.log(\'Using instrumented module file: '+module+'\');var ncover = require(\'nodecover\');\n';
	modified_lines.forEach(function(line) {
		bigLine = bigLine + line;
	});
	
	fs.writeFileSync(module+'.mod',bigLine); 
	fsutils.copyFile(module+'.mod', module, null);
	var fileStats = { lines: { total: _totalLines, source: _sourceLines, lines: slines, hit: [] }, functions: { total: _totalFunctions, hit: []}, blocks: {total: _totalBlocks, hit: []}};
	Stats[module] = fileStats;
};


var refreshModule = function(moduleName) {
	delete require.cache[moduleName];
};

exports.Stats = Stats;
exports.lineCovered = lineCovered;
exports.functionCovered = functionCovered;
exports.blockCovered = blockCovered;

var parseModule = function(module) {
    var tmp_module_file = module + '.bak';
	try {
		fs.unlinkSync(tmp_module_file);
	} catch(e) {
	}
	fsutils.copyFile(module, tmp_module_file, function(error) {
		if (error) {throw error;}
	});
	processLines(module, module);
	refreshModule(module);
};

var report = function() {
	reporter.printTxtReport(Stats);
};

var processDir = function(dir) {
	console.log('processing Dir: '+dir);
	var listOfFiles = fsutils.getListOfFiles(dir,js_regex);
	listOfFiles.forEach(function(file) {
		parseModule(file);
	});
		
	return listOfFiles;
};
exports.processDir = processDir;

var restoreFiles = function(files) {
	files.forEach(function(file) {
		fsutils.copyFile(file+ '.bak', file, function(e) { if (e) {throw e;}});
		fs.unlink(file +'.bak');
		fs.unlink(file + '.mod');
		fs.unlink(file + '.clean');
	});
	
};

exports.process = function(dirList,testDirs) {
	console.log('process('+dirList+','+testDirs+')');
	if (require.paths.indexOf(__dirname)<0) {
		require.paths.unshift(__dirname);
	}
	
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
			listOfFiles = listOfFiles.concat(processDir(dirList[i]));
		}
	}
	fs.writeFileSync('filelist.json',JSON.stringify(listOfFiles)); 
	try {
		testrunner.run(testDirs, {
			callback: function() {
				console.log('Writing nodecover report...');
				report();
				restoreFiles(listOfFiles);
			}	
		});
	} catch (ex) {
		restoreFiles(listOfFiles);
		console.log(ex);
	}
	process.on('uncaughtException', function(err) {
		console.log('Caught exception: '+err);
		listOfFiles = JSON.parse(fs.readFileSync('filelist.json'));
		restoreFiles(listOfFiles);
	});
};

