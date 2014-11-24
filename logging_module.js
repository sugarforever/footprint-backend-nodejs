var log4js = require("log4js");
var path = require("path");
var fs = require("fs");
var config = require("./configuration.json");
 
var mkdirs = module.exports.mkdirs = function(dirpath, mode, callback) {
    if (typeof dirpath == 'undefined' || dirpath.length == 0) {
        return;
    }

    var isAbsPath = false;
    if (dirpath[0] === '/') {
        isAbsPath = true;
    }

    var paths;
    if (isAbsPath) {
        paths = dirpath.substring(1).split("/");
        console.log(paths);
        paths[0] = "/" + paths[0];
    } else {
        paths = dirpath.split("/");
    }

    var basePath = "";
    for (var key in paths) {
        var _path = paths[key];
        basePath = basePath + "/" + _path;
        console.log(basePath);
        if (!path.existsSync(basePath)) {
            fs.mkdirSync(basePath);
            console.log(basePath + " created.");
        }
    }
}

exports.createDirIfNotExists = function(dir, callback) {
    if (!path.existsSync(dir)) {
        console.log(dir + " doesn't exist. It will be created.");
        mkdirs(dir, 0777, function(error) {
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

var logger = module.exports.getLogger(__filename);
logger.debug("This js file is " + __filename);
