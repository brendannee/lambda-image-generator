var fs = require('fs');
var exec = require('child_process').exec;

var fileName = 'process.zip';

var excludeFiles = [
  '*.git*',
  'build.sh',
  'node_modules/webshot/node_modules/phantomjs/bin/phantomjs',
  'sample-data*'
];

// Delete older build
try {
  fs.unlinkSync(fileName);
} catch(e) {
  // ignore errors
}


exec('zip -q -r ' + fileName + ' . -x ' + excludeFiles.join(' '), function(e, stdout, stderr) {
  if(e) {
    console.error(e);
  } else {
    console.log('zip file created: ' + fileName);
  }
});
