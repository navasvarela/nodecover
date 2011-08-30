// General utility Javascript code cleaner.
//
var fsutils = require('./fsutils.js');
var for_regex = /\bfor\b/;
var if_regex = /\bif\b/;
var else_regex =/\belse\b/;

var getLastLineOfBlock = function(lineNum, docLines) {
	var line = docLines[lineNum];
	if (line.indexOf('{') > 0) {
		while (line.indexOf('}') < 0 && docLines.length - 1 > lineNum ) {
			lineNum++;
		}		
	} else {
		if (line.indexOf(';') < 0) {
			lineNum++;
		}
	} 
	return lineNum;
};
var closingBracket = function(line) {
	var open = 0, index=0, has_opened = false;
	var i = 0, c;
	for (i = 0; i < line.length; i++) {
		c = line.charAt(i);	
		if (c === '('){
			open++;
			has_opened = true;
		}
		if (c === ')') {
			open--;
		}
		if (has_opened && open === 0) {
			return index;
		}	
		index++;
	}
	return -1;
};

var isLineInsideBlock = function(lineNum, blockList,docLines) {
	var isInside = false, i = 0, prevBlockLine = 0, lastLineOfBlock = 0;
	for (i=0;i<blockList.length;i++) {
		if (blockList[i] <= lineNum) {
			prevBlockLine = blockList[i];
		}
	}	
	lastLineOfBlock = getLastLineOfBlock(prevBlockLine, docLines);
	if (lastLineOfBlock >= lineNum) {
		isInside = true;
	}
	return isInside;
};

var findLinesWithFor = function(docLines) {
	var i = 0;
	var linesWithFor=[];
	for (i = 0; i < docLines.length ; i++) {
		if (for_regex.test(docLines[i]) && (docLines[i].indexOf('//') < 0 || ( docLines[i].indexOf(' for') < docLines[i].indexOf('//') )))	{
			linesWithFor.push(i);
		}
	}
	return linesWithFor;
};

var findLinesWithIfs = function(docLines) {
	var i = 0;
	var linesWithIfs = [];
	var linesWithFor = findLinesWithFor(docLines);
	for (i = 0; i < docLines.length ; i++) {
		if (if_regex.test(docLines[i]) && (docLines[i].indexOf('//') < 0 || ( docLines[i].indexOf(' if') < docLines[i].indexOf('//') )))	{
			if (!isLineInsideBlock(i,linesWithFor,docLines)) {			
				linesWithIfs.push(i);
			}
		}
	}
	return linesWithIfs;
		
};


var wrapIfStatement = function(lineNum, docLines) {
	var line = docLines[lineNum];
	if (line.indexOf('{') < 0) {
		var endCondition = line.indexOf('(') > 0 ? closingBracket(line):line.indexOf('else')+4;
		if (if_regex.test(line) && line.indexOf(';') > 0) {
			docLines[lineNum] = line.substring(0,endCondition+1)+' { ' + line.substring(endCondition+1) + ' } ';		
		} else if(else_regex.test(line) && line.indexOf(';') > 0) {
			docLines[lineNum] = line.substring(0, line.indexOf('else')+ 4) + ' {' + line.substring(line.indexOf('else') + 4)+' } ';
		} else {
			docLines[lineNum] = line.substring(0,endCondition+1)+' { '; 
			docLines[lineNum+1] += ' } ';
			lineNum ++;		
		}
		if (else_regex.test(docLines[lineNum +1]) && docLines[lineNum+1].indexOf('{') < 0 ) {	
			wrapIfStatement(lineNum+1,docLines);	
		}
	} 
};

var appendBeforeComments = function(lineNum, docLines, stringToAppend) {
	var currentLine = docLines[lineNum];
	if (currentLine.indexOf('//') < 0) {
		docLines[lineNum] = currentLine + stringToAppend;
	} else  {
		docLines[lineNum] = currentLine.substring(0,currentLine.indexOf('//')) + stringToAppend;
	}
};

var appendAfterIfElseBlock = function(currentLineNum, docLines, stringToAppend) {
	currentLineNum = getLastLineOfBlock(currentLineNum, docLines);
	if (for_regex.test(docLines[currentLineNum])) {
		currentLineNum = getLastLineOfBlock(currentLineNum , docLines);
	} 
	if (else_regex.test(docLines[currentLineNum + 1])) {
		appendAfterIfElseBlock(currentLineNum + 1, docLines, stringToAppend);
	} else {
		if (docLines[currentLineNum].indexOf(';') < 0) {
			currentLineNum++;
		}
		appendBeforeComments(currentLineNum, docLines, '}');
	} 
	return docLines;
};

function appendClosingBracketsAfterForBlocks(currentLineNum, docLines) {
	var nextLine = docLines[currentLineNum + 1];
	if (for_regex.test(docLines[currentLineNum + 1])) {
		appendClosingBracketsAfterForBlocks(currentLineNum + 1, docLines);
	} else if(if_regex.test(nextLine)) {
		if ((if_regex.test(nextLine) || else_regex.test(nextLine)) && nextLine.indexOf('{') < 0) {
			wrapIfStatement(currentLineNum + 1 , docLines);
		}
		appendAfterIfElseBlock(currentLineNum + 1, docLines, '}');
	} else {
		appendBeforeComments(currentLineNum + 1, docLines, '}');
	}
}

var cleanForLoopForLine = function(currentLine, currentLineNum, docLines) {
	var nestingLevel = 0;
	if (currentLine.indexOf('{') < 0 && fsutils.trimString(docLines[currentLineNum + 1]).charAt(0) !== '{') {
		if(for_regex.test(docLines[currentLineNum + 1])) {
			nestingLevel ++;
			cleanForLoopForLine(docLines[currentLineNum+1], currentLineNum + 1,docLines);
		}
		appendClosingBracketsAfterForBlocks(currentLineNum, docLines);
		appendBeforeComments(currentLineNum,docLines, ' {');
	}
	return nestingLevel;
};

var cleanForLoops = function(docLines) {
	var i = 0, currentLineNum = 0, currentLine = '', nestedFor = 0;
	linesWithFor = findLinesWithFor(docLines);
	for (i = 0; i < linesWithFor.length; i++) {
		if (nestedFor >  0) {
			nestedFor --;
		} else {
			currentLineNum = linesWithFor[i];
			currentLine = docLines[currentLineNum];
			nestedFor = cleanForLoopForLine(currentLine, currentLineNum, docLines);
		}
	}
	return docLines;
};

var clean = function(docLines) {
	var i = 0, line, linesWithIfs = [];
	linesWithIfs = findLinesWithIfs(docLines);
	docLines = cleanForLoops(docLines);
	for (i = 0; i < linesWithIfs.length ; i++) {
		wrapIfStatement(i, docLines);
	}	
	return docLines;
};

exports.closingBracket = closingBracket;
exports.wrapIfStatement = wrapIfStatement;
exports.findLinesWithFor = findLinesWithFor;
exports.cleanForLoops = cleanForLoops;
exports.appendAfterIfElseBlock = appendAfterIfElseBlock;
exports.isLineInsideBlock = isLineInsideBlock;
exports.clean = clean;
