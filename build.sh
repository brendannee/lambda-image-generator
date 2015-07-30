rm -f process.zip
rm node_modules/webshot/node_modules/phantomjs/bin/phantomjs
zip -r process.zip . -x *.git* -x build.sh
