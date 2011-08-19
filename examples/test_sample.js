var sample = require('./sample');
var assert = require('assert');
var testCase = require('nodeunit').testCase;

module.exports = testCase({
	"Sample test" : function(test) {
		sample.sampleFunction();	
		test.done();
	},

	"Test another function": function(test) {
		sample.anotherFunction();
		test.done();
	}
});

