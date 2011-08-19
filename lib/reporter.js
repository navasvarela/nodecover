var path = require('path');
var fsutils = require('./fsutils');
var fs = require('fs');
var winston = require('winston');
var getTotals = function() {
	winston.info(JSON.stringify(global.Stats));
	var count = 0, functions = 0, lines = 0, execLines = 0, usedfun = 0, usedlines = 0;
	var k;
    for (k in global.Stats) {
		if (global.Stats.hasOwnProperty(k)) {
			count++;
			functions += global.Stats[k].functions.total;
			usedfun += global.Stats[k].functions.hit.length;
			lines += global.Stats[k].lines.total;
			execLines += global.Stats[k].lines.source;	
			usedlines += global.Stats[k].lines.hit.length;
		}
	}
	return {
		totalModules: count,
		totalFunctions: functions,
		totalLines: lines,
		totalExecLines: execLines,
		usedFunctions: usedfun,
		usedLines: usedlines
	};
};

var getPerModuleStats = function() {
	var stats = global.Stats;
	var report = '\n';
	var module;
	report += 'COVERAGE BREAKDOWN BY PACKAGE\n';
	report += '[function %] | [lines %] | [ module ]\n';
	for (module in stats) {
		if (stats.hasOwnProperty(module)) {
			console.log(JSON.stringify(module));
			report += 100*stats[module].functions.hit.length / stats[module].functions.total + '% ('+stats[module].functions.hit.length + '/'+ stats[module].functions.total+') |';
			report += 100*stats[module].lines.hit.length / stats[module].lines.source + '% ('+stats[module].lines.hit.length+'/'+stats[module].lines.source+')';
			report += ' | '+module;
		}
	}
	return report;
	
};

var printReportToFile = function(report) {
	var reportsDir = path.normalize(process.cwd()+'/reports');
	fsutils.createDir(reportsDir);
	fs.writeFileSync(reportsDir+'/nodecover.txt',report);
	
};

exports.printTxtReport = function() {
	var now = new Date().toUTCString();
	var totals = getTotals();
	var report = 'nodecover v0.1.0 report, generated '+	now +'\n';
	report += '------------------------------------------------------------------------------\n';
	report += '\n';
	report += 'OVERALL COVERAGE SUMMARY\n';
	report += '[function %] | [lines %]\n';
	report += 100*totals.usedFunctions / totals.totalFunctions + '% ('+totals.usedFunctions+'/'+totals.totalFunctions+') |';
	report += 100*totals.usedLines / totals.totalExecLines + '% ('+totals.usedLines+'/'+totals.totalExecLines+')\n';
	report += '\n';
	report += 'OVERALL STATS SUMMARY \n';
	report += '\n';
	report += 'total modules: '+totals.totalModules+'\n';
	report += 'total functions: '+totals.totalFunctions+'\n';
	report += 'total lines: '+totals.totalLines+'\n';
	report += 'total executable lines: '+totals.totalExecLines+'\n';
	report += getPerModuleStats();
	report +='\n';
    console.log(report);
	printReportToFile(report);
		
};

