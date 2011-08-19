var path = require('path');
var fsutils = require('./fsutils');
var fs = require('fs');
var getTotals = function() {
	var count = 0, functions = 0, lines = 0, execLines = 0;
	var k;
    for (k in global.Stats) {
		if (global.Stats.hasOwnProperty(k)) {
			count++;
			functions += global.Stats[k].functions.total;
			lines += global.Stats[k].lines.total;
			execLines += global.Stats[k].lines.source;	
		}
	}
	return {
		totalModules: count,
		totalFunctions: functions,
		totalLines: lines,
		totalExecLines: execLines
	};
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
	report += 'OVERALL STATS SUMMARY \n';
	report += '\n';
	report += 'total modules: '+totals.totalModules+'\n';
	report += 'total functions: '+totals.totalFunctions+'\n';
	report += 'total lines: '+totals.totalLines+'\n';
	report += 'total executable lines: '+totals.totalExecLines+'\n';
    console.log(report);
	printReportToFile(report);
		
};

