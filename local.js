var fs = require('fs');
var opener = require('opener');
var lambda = require('./index.js');

var args = process.argv.slice(2);
var sampleData;
var type = args[0] || 'image';

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
  var html;

  if(type === 'image') {
    html = '<img src="data:image/png;base64,' + message + '">';
  } else if(type === 'html') {
    html = message;
  }

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

if(type === 'image') {
  lambda.handler(sampleData, Context);
} else if(type === 'html') {
  lambda.html(sampleData, Context);
}
