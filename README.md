nodecover
=========

A lightweight, pure-javascript code coverage tool for nodejs applications. It works out of the box with nodeunit, offering support for more TDD frameworks soon. Generates reports similar to EMMA, in text and html. 

Support will be added to custom reporters as well as custom TDD frameworks.


Usage
-----
Install in your system using 
  
  npm install nodecover -g

Then, in your project folder, type:

  nodecover -s [list of files/folders to instrument] -t [List of files/folders with nodeunit tests]
  
The output would look like this:

------------------------------------------------------------------------------

OVERALL COVERAGE SUMMARY
[function %] | [blocks %] | [lines %]
100% (3/3) |100% (3/3) |100% (2/2)

OVERALL STATS SUMMARY 

total modules: 1
total functions: 3
total blocks: 3
total lines: 16
total executable lines: 2

COVERAGE BREAKDOWN BY PACKAGE
[function %] | [blocks %] | [lines %] | [ module ] 
 100% (3/3) | 100% (3/3) | 100% (2/2) | examples/sample.js
 

You can also view a coverage report per file:
  
  nodecover -r [file]
  
Displays a report with green lines on the lines that were used and red were missed.


TODO
----
  - Add support to vows.js
  - Add support to jasmine.js


