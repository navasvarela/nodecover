var testCase = require('nodeunit').testCase;
var cleaner = require('../lib/cleaner');

module.exports = testCase({
	"Should find lines with for" : function(test) {
		var testLines = ['First linefor', 'second line for loop 1', 'for loop 2', 'This is not a forloop'];
		var linesWithFor = cleaner.findLinesWithFor(testLines);
		test.equal(2,linesWithFor.length);
		test.deepEqual([1,2], linesWithFor);
		test.done();	
	},

		
	"Should find closing bracket" : function(test) {
		var testString = "(1(3(5)))8";
		var closingBracket = cleaner.closingBracket(testString);
		test.equal(8,closingBracket);
		test.done();
	},

	"Should cleanup single statement for loops": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','console.log("Hello World");'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','console.log("Hello World");}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup for loops with if statements": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if (true) console.log("Hello World");'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','if (true) console.log("Hello World");}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup single for loops with if-else statements": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if (true) console.log("Hello World");', 'else blah;'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','if (true) console.log("Hello World");', 'else blah;}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	
	
});