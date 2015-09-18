var fs = require('fs');
var opener = require('opener');
var lambda = require('./index.js');

var sampleData;

try {
  sampleData = JSON.parse(fs.readFileSync('sample-data/trip.json', 'utf8'));
} catch(e) {
  console.error('Invalid JSON sample file');
  process.exit(1);
}


function Context () {}

Context.done = function(e, message) {
  if(e) {
    console.error(e);
    process.exit(1);
  }

  var outputFileName = 'sample-data/trip.html';
  var html = '<img src="data:image/png;base64,' + message + '">';

  // Write temporary HTML file
  fs.writeFile(outputFileName, html, function(e) {
    if(e) {
      console.error(e);
      process.exit(1);
    } else {
      opener(outputFileName);

      console.log('File written to ' + outputFileName);

    	process.exit();
    }
  });
};

lambda.handler(sampleData, Context);
