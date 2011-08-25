var path = require('path');
var fsutils = require('./fsutils');
var fs = require('fs');
var winston = require('winston');
var clc = require('cli-color');

var Stats = {};
var stats_file = path.normalize(process.cwd()+'/nodecover-stats.json');

var getTotals = function() {
	winston.info(JSON.stringify(Stats));
	var count = 0, functions = 0, blocks = 0, lines = 0, execLines = 0, usedfun = 0, _usedBlocks = 0, usedlines = 0;
	var k;
    for (k in Stats) {
		if (Stats.hasOwnProperty(k)) {
			count++;
			functions += Stats[k].functions.total;
			usedfun += Stats[k].functions.hit.length;
			blocks += Stats[k].blocks.total;
			_usedBlocks += Stats[k].blocks.hit.length;
			lines += Stats[k].lines.total;
			execLines += Stats[k].lines.source;	
			usedlines += Stats[k].lines.hit.length;
		}
	}
	return {
		totalModules: count,
		totalFunctions: functions,
		totalBlocks: blocks,
		totalLines: lines,
		totalExecLines: execLines,
		usedFunctions: usedfun,
		usedBlocks: _usedBlocks,
		usedLines: usedlines
	};
};

var getModuleStats = function(mod,stats) {
	var report = '';
		report += ' '+100*stats.functions.hit.length / stats.functions.total + '% ('+stats.functions.hit.length + '/'+ stats.functions.total+') |';           
		report += ' '+100*stats.blocks.hit.length / stats.blocks.total + '% ('+stats.blocks.hit.length + '/'+ stats.blocks.total+') |';   
		report += ' '+100*stats.lines.hit.length / stats.lines.source + '% ('+stats.lines.hit.length+'/'+stats.lines.source+')';
		report += ' | '+mod;
	return report;
};

var getPerModuleStats = function() {
	var stats = Stats;
	var report = '\n';
	var mod;
	report += 'COVERAGE BREAKDOWN BY PACKAGE\n';
	report += '[function %] | [blocks %] | [lines %] | [ module ] \n';
	for (mod in stats) {
		if (stats.hasOwnProperty(mod)) {
			report += getModuleStats(mod, stats[mod]);
		}
	}	
	return report;
	
};

var printReportToFile = function(report) {
	var reportsDir = path.normalize(process.cwd()+'/reports');
	fsutils.createDir(reportsDir);
	fs.writeFileSync(reportsDir+'/nodecover.txt',report);

};

exports.printTxtReport = function(nodecover_stats) {
	Stats = nodecover_stats;
	fs.writeFileSync(stats_file, JSON.stringify(Stats, null, 4));
	var now = new Date().toUTCString();
	var totals = getTotals();
	var report = 'nodecover v0.1.0 report, generated '+	now +'\n';
	report += '------------------------------------------------------------------------------\n';
	report += '\n';
	report += 'OVERALL COVERAGE SUMMARY\n';
	report += '[function %] | [blocks %] | [lines %]\n';
	report += 100*totals.usedFunctions / totals.totalFunctions + '% ('+totals.usedFunctions+'/'+totals.totalFunctions+') |';
	report += 100*totals.usedBlocks / totals.totalBlocks + '% ('+totals.usedBlocks+'/'+totals.totalBlocks+') |';
	report += 100*totals.usedLines / totals.totalExecLines + '% ('+totals.usedLines+'/'+totals.totalExecLines+')\n';
	report += '\n';
	report += 'OVERALL STATS SUMMARY \n';
	report += '\n';
	report += 'total modules: '+totals.totalModules+'\n';
	report += 'total functions: '+totals.totalFunctions+'\n';
	report += 'total blocks: '+totals.totalBlocks+'\n';
	report += 'total lines: '+totals.totalLines+'\n';
	report += 'total executable lines: '+totals.totalExecLines+'\n';
	report += getPerModuleStats();
	report +='\n';
    console.log(report);
	printReportToFile(report);
		
};

exports.printModuleReport = function(module) {
	console.log(' printing module report for module '+module+'\n');
	var stats_string = fs.readFileSync(stats_file);
	var stats = JSON.parse(stats_string);
	var module_stats = stats[module];
	var module_string = fs.readFileSync(path.normalize(process.cwd()+'/'+module)).toString();
	var lineNumber = 0;
	var report = '\n              MODULE COVERAGE REPORT   \n';
	
	report += '[function %] | [blocks %] | [lines %] | [ module ] \n';
    report += getModuleStats(module,module_stats);
    report += '\n----------------------------------------------------------\n';
    console.log(clc.bold(report));
	module_string.split('\n').forEach(function(line) {
		lineNumber++;
		line = lineNumber + '\t' + line;
		if (module_stats.lines.lines.indexOf(lineNumber) >= 0) {
			if (module_stats.lines.hit.indexOf(lineNumber) >= 0) {	
				console.log(clc.bgGreen(line));
			} else {
				console.log(clc.bgColor(line));
			}
		} else {
			console.log(line);
		}	
		
	});
};
