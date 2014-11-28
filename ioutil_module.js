var path = require("path");
var fs = require("fs");

exports.mkdirs = function(dirpath, mode, callback) {
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
        console.log("DEBUG: " + dir + " doesn't exist. It will be created.");
        module.exports.mkdirs(dir, 0777, function(error) {
            if (error != null) {
                console.log("ERROR: " + error);
            }

            callback(error);
        });
    }
}
