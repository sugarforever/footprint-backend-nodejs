var log4js = require("log4js");
var config = require("./configuration.json");

exports.getLogger = function(js) {
	log4js.configure({
		appenders: [
			{ 
				type: 'console'
			},
    		{
				type: 'file',
				filename: config.logFile, 
				maxLogSize: 1024 * 1024,
				backups:3,
				category: 'normal' 
			}
		]
	});
	var logger = log4js.getLogger(js);
	return logger;
}

var logger = module.exports.getLogger(__filename);
logger.debug("This js file is " + __filename);
