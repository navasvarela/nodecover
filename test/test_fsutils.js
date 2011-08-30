var fsutils = require('../lib/fsutils');
var assert = require('assert');
var testCase = require('nodeunit').testCase;
var fs = require('fs');

module.exports = testCase({
		"Should trim string" : function(test) {
		test.equal('Hello', fsutils.trimString('   Hello   '));

		test.done();
		},
		"Should Init Log":  function(test) {
		fsutils.initLog();
		
		test.done();	
		}
		,
		"Should copy file": function(test) {
			var origSize, copySize;
			fsutils.copyFile('README.md','README.bak', null);
            test.ok(fs.statSync('README.bak'));
			origSize = fs.statSync('README.md').size;
			copySize = fs.statSync('README.bak').size;
			test.equal(origSize,copySize);
			fs.unlink('./README.bak');			
			test.done();
		},
		
		"Should walk directory": function(test) {
			var listOfFiles = fsutils.getListOfFiles('../',/\.js$/);
			test.ok(listOfFiles.indexOf(__filename) > 0, 'the returned list of files should contain '+__filename);
			test.done();
		}
		
});


