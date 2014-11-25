var log4js = require("log4js");
var path = require("path");
var fs = require("fs");
var config = require("./configuration.json");
var ioutil = require("./ioutil_module");

exports.createDirIfNotExists = function(dir, callback) {
    if (!path.existsSync(dir)) {
        console.log(dir + " doesn't exist. It will be created.");
        ioutil.mkdirs(dir, 0777, function(error) {
            if (error != null) {
                console.log(error);
            }

            callback(error);
        });
    }
}

var logParent = path.dirname(config.logFile);
module.exports.createDirIfNotExists(logParent, function(error){});

exports.getLogger = function(js) {

	log4js.configure({
		appenders: [
			{ 
				type: 'console'
			},
    		{
				type: 'file',
				filename: config.logFile, 
				maxLogSize: 1024,
				backups:3,
				category: js
			}
		]
	});
	var logger = log4js.getLogger(js);
	return logger;
}