// General utility Javascript code cleaner.
//

var fsutils = require('./fsutils.js');
var for_regex = /\bfor\b/;
var if_regex = /\bif\b/;
var else_regex =/\belse\b/;
var block_regex = /\b(if|else|for)\b/;
 
var logger = fsutils.logger;
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

var isAnObject = function(lineNum,  docLines) {
	var result = false;
	var line=docLines[lineNum-1];
	line = fsutils.trimString(line);
	if (line === undefined) {
		return false;
	}
	if (line.indexOf('{') >= 0) {
		if (line.indexOf('{') === (line.length - 1)) {
			do {
				lineNum++;
				line = docLines[lineNum-1];
			} while (/^\s*\/\//.test(line));	
		}
		if (line.indexOf(':') > 0 || docLines[lineNum].indexOf(':') > 0 || line.indexOf('{}') === line.indexOf('{')) {
			return true;
		}
	}
	return result;
};

var isStatement = function(lineNum,docLines) {
	var result = true;
	if (docLines[lineNum].indexOf('{') >= 0 || ((lineNum + 1) < docLines.length && docLines[lineNum+1].indexOf('{')>= 0)) {
		result = false;
	}
	return result;
};

var endOfStatement = function(lineNum,docLines) {
	var line = docLines[lineNum];
	if (line.indexOf('(')) {
		line = line.substring(closingBracket(line));
	}
	if (line.indexOf(';') < 0) {
		lineNum++;
	}
	return lineNum;
};

var isIfBlock = function(line) {
	return if_regex.test(line) && (line.indexOf('//') < 0 || (line.indexOf('//') > line.indexOf('if')));
};
			
var getLastLineOfBlock = function(lineNum, docLines) {
	var line = docLines[lineNum];
	var isElseInAnotherBlock = false;
	var isAnIfBlock = isIfBlock(line);
	if (line.indexOf('{') > 0) {
		while (line.indexOf('}') < 0 && docLines.length - 1 > lineNum ) {
			lineNum++;
			line = docLines[lineNum];
			if (line.indexOf('{') > 0) {
				lineNum = getLastLineOfBlock(lineNum, docLines);
			}
		}
		
		if (isAnIfBlock && else_regex.test(docLines[lineNum+1])) {
			if (docLines[lineNum+1].indexOf('}') < 0 || (docLines[lineNum+1].indexOf('}') > docLines[lineNum+1].indexOf('else')) ) {
				lineNum = getLastLineOfBlock(lineNum + 1, docLines);
			}
		}			
	} else {
		if (line.indexOf(')') > 0) {
			line = line.substring(closingBracket(line));
		}

		if (line.indexOf(';') < 0 && line.indexOf('}') < 0 ) {
			lineNum++;
			if (block_regex.test(docLines[lineNum])) {
				lineNum = getLastLineOfBlock(lineNum,docLines);
			} else if (else_regex.test(docLines[lineNum+1])) {
				lineNum = getLastLineOfBlock(lineNum+1,docLines);
			} 
		} 
	}
	return lineNum;
};

var isLineInsideBlock = function(lineNum, blockList,docLines) {
	var isInside = false, i = 0, prevBlockLine = -1, lastLineOfBlock = 0;
	for (i=0;i<blockList.length;i++) {
		if (blockList[i] < lineNum) {
			prevBlockLine = blockList[i];
		}
	}
	if (prevBlockLine < 0) {
		return false;
	}	
	lastLineOfBlock = getLastLineOfBlock(prevBlockLine, docLines);
	if (lastLineOfBlock >= lineNum) {
		isInside = true;
	}
	return isInside;
};

var isPlainForLoop = function(line) {
	var endOfBracket = closingBracket(line);
	var i = 0;
	if (line.indexOf('//') >= 0) {
		line = line.substring(0,line.indexOf('//'));
	}
	var lineAfterBracket = line.substring(endOfBracket+1);
	lineAfterBracket = fsutils.trimString(lineAfterBracket);
	if (!/\w/.test(lineAfterBracket) && lineAfterBracket.indexOf(';') >= 0) {
		return true;
	}
	return false;
	
};

var findLinesWithFor = function(docLines) {
	var i = 0;
	var linesWithFor=[];
	for (i = 0; i < docLines.length ; i++) {
		if (for_regex.test(docLines[i]) && 
				(docLines[i].indexOf('//') < 0 || ( docLines[i].indexOf('for') < docLines[i].indexOf('//') )))	{
			if (!isPlainForLoop(docLines[i])) {
				linesWithFor.push(i);
			}
		}
	}	
	return linesWithFor;
};

var findLinesWithIfs = function(docLines) {
	var i = 0;
	var linesWithIfs = [];
	var linesWithFor = findLinesWithFor(docLines);
	for (i = 0; i < docLines.length ; i++) {
		if (if_regex.test(docLines[i]) && /^[^\/]*\bif\b.*(?:\/\/)?.*/.test(docLines[i]))	{
			if (!isLineInsideBlock(i,linesWithFor,docLines) && docLines[i].indexOf('{') < 0) {			
				linesWithIfs.push(i);
			}
		}
	}
	return linesWithIfs;
		
};

var appendBeforeComments = function(lineNum, docLines, stringToAppend) {
	var currentLine = docLines[lineNum];
	if (currentLine.indexOf('//') < 0) {
		docLines[lineNum] = currentLine + stringToAppend;
	} else  {
		docLines[lineNum] = currentLine.substring(0,currentLine.indexOf('//')) + stringToAppend;
	}
};

var wrapIfStatement = function(lineNum, docLines) {
	var origLineNum = lineNum;
	var line = docLines[lineNum], lastLineOfBlock = 0;
	if (line.indexOf('{') < 0) {
		var endCondition = line.indexOf('(') > 0 ? closingBracket(line):line.indexOf('else')+4;
		if (if_regex.test(line) && line.indexOf(';') > 0) {
			docLines[lineNum] = line.substring(0,endCondition+1)+'{' + line.substring(endCondition+1);
			appendBeforeComments(lineNum,docLines, '}');		
		} else if(else_regex.test(line) && line.indexOf(';') > 0) {
			docLines[lineNum] = line.substring(0, line.indexOf('else')+ 4) + '{' + line.substring(line.indexOf('else') + 4)+'}';
		} else if(for_regex.test(docLines[lineNum+1])) {
			lastLineOfBlock = getLastLineOfBlock(lineNum+1,docLines);
			docLines[lineNum] = line.substring(0,endCondition+1)+'{';
			lineNum += (lastLineOfBlock - lineNum);
			appendBeforeComments(lineNum,docLines,'}'); 
		} else {
			docLines[lineNum] = line.substring(0,endCondition+1)+'{';
			do {
				lineNum++;
			} while(docLines[lineNum].indexOf(';') < 0);
			appendBeforeComments(lineNum,docLines,'}'); 
			return;		
		}
	} else {
		lineNum = getLastLineOfBlock(lineNum,docLines);
	}
	 
	if (else_regex.test(docLines[lineNum +1]) && docLines[lineNum+1].indexOf('{') < 0 ) {	
		wrapIfStatement(lineNum+1,docLines);	
	} else if (else_regex.test(docLines[lineNum]) && docLines[lineNum].indexOf('{') < 0 ) {	
		wrapIfStatement(lineNum,docLines);
	}
};


var appendAfterIfElseBlock = function(currentLineNum, docLines, stringToAppend) {
	var origLineNum = currentLineNum;
	currentLineNum = getLastLineOfBlock(currentLineNum, docLines);
	if (for_regex.test(docLines[currentLineNum])) {
		currentLineNum = getLastLineOfBlock(currentLineNum , docLines);
	}
	if (isStatement(currentLineNum,docLines)) {
		currentLineNum = endOfStatement(currentLineNum, docLines);
	} else {
		currentLineNum = getLastLineOfBlock(currentLineNum,docLines);
	}
	if (docLines[currentLineNum].indexOf(';') < 0) {
		currentLineNum++;
	}
	appendBeforeComments(currentLineNum, docLines, '}'); 
	return docLines;
};

function appendClosingBracketsAfterForBlocks(currentLineNum, docLines) {
	logger.debug('appendClosingBracketsAfterForBlocks: '+currentLineNum);
	var nextLine = docLines[currentLineNum + 1];
	if (for_regex.test(docLines[currentLineNum + 1])) {
		currentLineNum = getLastLineOfBlock(currentLineNum + 1, docLines);
		appendBeforeComments(currentLineNum , docLines , '}');	
	} else if(isIfBlock(nextLine) ) {
		wrapIfStatement(currentLineNum + 1 , docLines);
		appendAfterIfElseBlock(currentLineNum + 1, docLines, '}');
	} else {
		appendBeforeComments(currentLineNum + 1, docLines, '}');
	}
}

var cleanForLoopForLine = function(currentLine, currentLineNum, docLines) {
	var lastLineOfBlock = 0, i = 0;
	if (currentLine.indexOf('{') < 0 && fsutils.trimString(docLines[currentLineNum + 1]).charAt(0) !== '{') {
		if(for_regex.test(docLines[currentLineNum + 1])) {
			cleanForLoopForLine(docLines[currentLineNum+1], currentLineNum + 1,docLines);
		}
		appendClosingBracketsAfterForBlocks(currentLineNum, docLines);
		appendBeforeComments(currentLineNum,docLines, '{');
	} else  {
		lastLineOfBlock = getLastLineOfBlock(currentLineNum,docLines);
		for(i = 1; i < (lastLineOfBlock - currentLineNum); i++) {
			if (isIfBlock(docLines[currentLineNum+i])) {
				wrapIfStatement(currentLineNum+i,docLines);	
			}
		}
		
	}
};

var cleanForLoops = function(docLines) {
	var i = 0, currentLineNum = 0, currentLine = '', nestedFor = 0;
	linesWithFor = findLinesWithFor(docLines);
	for (i = 0; i < linesWithFor.length; i++) {
		currentLineNum = linesWithFor[i];
		currentLine = docLines[currentLineNum];
		nestedFor = cleanForLoopForLine(currentLine, currentLineNum, docLines);
	}
	return docLines;
};

var clean = function(docLines) {
	var i = 0, line, linesWithIfs = [], resultLines = docLines.slice(0);
	linesWithIfs = findLinesWithIfs(resultLines);
	resultLines = cleanForLoops(resultLines);
	for (i = 0; i < linesWithIfs.length ; i++) {
		wrapIfStatement(linesWithIfs[i], resultLines);
	}	
	return resultLines;
};

exports.closingBracket = closingBracket;
exports.wrapIfStatement = wrapIfStatement;
exports.findLinesWithFor = findLinesWithFor;
exports.cleanForLoops = cleanForLoops;
exports.appendAfterIfElseBlock = appendAfterIfElseBlock;
exports.isLineInsideBlock = isLineInsideBlock;
exports.clean = clean;
exports.appendBeforeComments = appendBeforeComments;
exports.isAnObject = isAnObject;
