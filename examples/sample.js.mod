console.log('Using instrumented module file: examples/sample.js');var ncover = require('nodecover');
exports.sampleFunction = function () {ncover.functionCovered('examples/sample.js',1);
console.log("Hello from sampleFunction"); ncover.lineCovered('examples/sample.js',2);
console.log(JSON.stringify(global.Stats)); ncover.lineCovered('examples/sample.js',3);
};

exports.anotherFunction = function() {ncover.functionCovered('examples/sample.js',6);
"This is a function".split(" ").forEach(function(word) {ncover.functionCovered('examples/sample.js',7);
console.log("Printing: "+word); ncover.lineCovered('examples/sample.js',8);
});
console.log(JSON.stringify(global.Stats)); ncover.lineCovered('examples/sample.js',10);
};


