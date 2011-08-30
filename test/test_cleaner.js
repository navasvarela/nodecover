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
		var shouldBeLines = ['for (i=0;i<blah;i++) {','if (true) {  console.log("Hello World"); } }'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup single for loops with if-else statements": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if (true) console.log("Hello World");', 'else blah;'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','if (true) {  console.log("Hello World"); } ', 'else { blah; } }'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
	},
	"Should cleanup nested for loops": function(test) {
		
		var testLines = ['for (i=0;i<blah;i++)','for(j=0;j<blablah;j++) ', 'do blah;'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','for(j=0;j<blablah;j++)  {', 'do blah;}}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup nested for loops with if-else": function(test) {
		
		var testLines = ['for (i=0;i<blah;i++)','for(j=0;j<blablah;j++) ', 'if(echo) blah;', 'else bloo;'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','for(j=0;j<blablah;j++)  {', 'if(echo) {  blah; } ', 'else { bloo; } }}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
	},
	"Should cleanup nested for loops with if-else blocks": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','for(j=0;j<blablah;j++) ', 'if(echo) {','blah;', '} else bloo;'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','for(j=0;j<blablah;j++)  {', 'if(echo) {','blah;', '} else bloo;}}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
	},
	"Should append after if-else block": function(test) {
		var testLines = ['if(echo) {','blah;', '} else bloo;'];
		var shouldBeLines = ['if(echo) {','blah;', '} else bloo;}'];
		test.deepEqual(shouldBeLines,cleaner.appendAfterIfElseBlock(0,testLines, '}') );
		test.done();
	},
	"Should append after if-else block when else is statement and in next line": function(test) {
		var testLines = ['if(echo) {','blah;', '} else', 'bloo;'];
		var shouldBeLines = ['if(echo) {','blah;', '} else', 'bloo;}'];
		test.deepEqual(shouldBeLines,cleaner.appendAfterIfElseBlock(0,testLines, '}') );
		test.done();
	},
	"Should append after if-else block with nested for loop": function(test) {
		var testLines = ['if(echo) ','for (too)',' blah;', 'else', 'bloo;'];
		var shouldBeLines = ['if(echo) ','for (too)',' blah;', 'else', 'bloo;}'];
		test.deepEqual(shouldBeLines,cleaner.appendAfterIfElseBlock(0,testLines, '}') );
		test.done();
		
	},
	"Should cleanup for loop with if-else statements in several lines": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if(echo)',' blah;', 'else',' bloo;'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','if(echo) { ',' blah; } ', 'else { ',' bloo; } }'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();

	},
	"Should find line inside block": function(test) {
	
		var testLines = ['for (i=0;i<blah;i++) {','if(echo)',' blah;', 'else',' bloo; }'];
		test.ok(cleaner.isLineInsideBlock(1,[0],testLines));
		test.done();	
	}
	
	
	
});
