var path = require('path');
var fsutils = require('./fsutils');
var fs = require('fs');
var winston = require('winston');
var Stats = {};
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

var getPerModuleStats = function() {
	var stats = Stats;
	var report = '\n';
	var module;
	report += 'COVERAGE BREAKDOWN BY PACKAGE\n';
	report += '[function %] | [blocks %] | [lines %] | [ module ] \n';
	for (module in stats) {
		if (stats.hasOwnProperty(module)) {
			console.log(JSON.stringify(module));
			report += ' '+100*stats[module].functions.hit.length / stats[module].functions.total + '% ('+stats[module].functions.hit.length + '/'+ stats[module].functions.total+') |';
			
			report += ' '+100*stats[module].blocks.hit.length / stats[module].blocks.total + '% ('+stats[module].blocks.hit.length + '/'+ stats[module].blocks.total+') |';
			report += ' '+100*stats[module].lines.hit.length / stats[module].lines.source + '% ('+stats[module].lines.hit.length+'/'+stats[module].lines.source+')';
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

exports.printTxtReport = function(nodecover_stats) {
	Stats = nodecover_stats;
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

