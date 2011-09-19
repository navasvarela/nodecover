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
		var shouldBeLines = ['for (i=0;i<blah;i++){','console.log("Hello World");}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup for loops with if statements": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if (true) console.log("Hello World");'];
		var shouldBeLines = ['for (i=0;i<blah;i++){','if (true){ console.log("Hello World");}}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup single for loops with if-else statements": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if (true) console.log("Hello World");', 'else blah;'];
		var shouldBeLines = ['for (i=0;i<blah;i++){','if (true){ console.log("Hello World");}', 'else{ blah;}}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
	},
	"Should cleanup nested for loops": function(test) {
		
		var testLines = ['for (i=0;i<blah;i++)','for(j=0;j<blablah;j++) ', 'do blah;'];
		var shouldBeLines = ['for (i=0;i<blah;i++){','for(j=0;j<blablah;j++) {', 'do blah;}}'];
		test.deepEqual(shouldBeLines,cleaner.cleanForLoops(testLines));
		test.done();
	},
	"Should cleanup nested for loops with if-else": function(test) {
		
		var testLines = ['for (i=0;i<blah;i++)','for(j=0;j<blablah;j++) ', 'if(echo) blah;', 'else bloo;'];
		var shouldBeLines = ['for (i=0;i<blah;i++){','for(j=0;j<blablah;j++) {', 'if(echo){ blah;}', 'else{ bloo;}}}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
	},
	"Should cleanup nested for loops with if-else blocks": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','for(j=0;j<blablah;j++) ', 'if(echo) {','blah;', '} else bloo;'];
		var shouldBeLines = ['for (i=0;i<blah;i++){','for(j=0;j<blablah;j++) {', 'if(echo) {','blah;', '} else{ bloo;}}}'];
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
	"Should clean if-else block with nested for loop": function(test) {
		var testLines = ['if(echo) ','for (too)',' blah;', 'else', 'bloo;'];
		var shouldBeLines = ['if(echo){','for (too){',' blah;}}', 'else{', 'bloo;}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
		
	},
	"Should clean else block with nested for loop": function(test) {
		var testLines = ['if(echo) ',' blah;', 'else', 'for(too)',' bloo;'];
		var shouldBeLines = ['if(echo){',' blah;}', 'else{','for(too){', ' bloo;}}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
		
	},
	"Should clean single line ifs with comments": function(test) {
		var testLines = ['if(echo) do this; // comment'];
		var shouldBeLines = ['if(echo){ do this; }'];
		test.deepEqual(shouldBeLines, cleaner.clean(testLines));
		test.done();
	},
	"Should cleanup for loop with if-else statements in several lines": function(test) {
		var testLines = ['for (i=0;i<blah;i++)','if(echo)',' blah;', 'else',' bloo;'];
		var shouldBeLines = ['for (i=0;i<blah;i++){','if(echo){',' blah;}', 'else{',' bloo;}}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();

	},
	"Should find line inside block": function(test) {
	
		var testLines = ['for (i=0;i<blah;i++) {','if(echo)',' blah;', 'else',' bloo; }'];
		test.ok(cleaner.isLineInsideBlock(1,[0],testLines));
		test.done();	
	},
	"Should leave line as it is": function(test) {
		var testLines = ['var uuid = require(\'uuid\');', 'if (echo) true;'];
		test.deepEqual(testLines[0], cleaner.clean(testLines)[0]);
		test.done();
	},
	"Should clean if-else blocks inside for block": function(test) {
		
		var testLines = ['for (i=0;i<blah;i++) {','if(echo)',' blah;', 'else',' bloo; }'];
		var shouldBeLines = ['for (i=0;i<blah;i++) {','if(echo){',' blah;}', 'else{',' bloo; }}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();
	},
	"Should not find if-else blocks inside comments": function(test) {
		var testLines = ['//if the world was flat','if(echo)',' blah;// another if ', 'else',' bloo; '];
		var shouldBeLines = ['//if the world was flat','if(echo){',' blah;}', 'else{',' bloo; }'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));
		test.done();

	},
	"Should not clean plain for loops":  function(test) {
		var testLines = ['function bitSize(x) {','var j,z,w;','for (j=x.length-1; (x[j]==0) && (j>0); j--);','for (z=0,w=x[j]; w; (w>>=1),z++);','z+=bpe*j;'];
		var cleanLines = cleaner.clean(testLines);
		console.log('testLines:'+JSON.stringify(testLines));
		console.log('cleanLines: '+JSON.stringify(cleanLines));
		test.deepEqual(testLines,cleaner.clean(testLines));
		test.done();
	},
	"Should clean if-for-if blocks":  function(test) {
		var testLines = ['if (x.length>y.length) {','for (;i<x.length;i++)','if (x[i])','return 0;','} else {','for (;i<y.length;i++)','if (y[i])','return 0;','}'];
		var shouldBeLines = ['if (x.length>y.length) {','for (;i<x.length;i++){','if (x[i]){','return 0;}}','} else {','for (;i<y.length;i++){','if (y[i]){','return 0;}}','}'];
		test.deepEqual(shouldBeLines,cleaner.clean(testLines));	
		test.done();
	},
    "Should not clean this plain for loop": function(test) {
		var testLines = ['for (bpe=0; (1<<(bpe+1)) > (1<<bpe); bpe++); // bpe=something ','bpe>>=1;'];
		var cleanLines = cleaner.clean(testLines);
		console.log('testLines:'+JSON.stringify(testLines));
		console.log('cleanLines: '+JSON.stringify(cleanLines));
		
		test.deepEqual(testLines,cleanLines);
		test.done();
	},

	"Should find closing bracket with several nested brackets" : function(test) {
		var line = 'for (bpe=0; (1<<(bpe+1)) > (1<<bpe); bpe++); // bpe=something ';
		test.equal(42, cleaner.closingBracket(line));		
		test.done();
	},
	"Should not process for word in comment" : function(test) {
		var testLines = ['//do x=x*y mod n for bigInts x,y,n.','//for something','function f() {','if (something) { do it;}'];
		console.log(JSON.stringify(cleaner.clean(testLines)));
		test.deepEqual(testLines,cleaner.clean(testLines));
		test.done();
	},
	"Should clean if blocks with nested try catch block":  function (test) {
		var testLines = ['if (echo)','try {','do this;','} catch(e) {','throw e;}'];
		var shouldBeLines = ['if (echo) {', 'try {','do this;','} catch(e) {','throw e;}}']; 
		test.deepEqual(shouldBeLines, cleaner.clean(testLines));
		test.done();
	}
	
});
