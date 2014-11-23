var mongo = require("mongodb");
var url = require("url");
var fs = require("fs");
var path = require("path");
var config = require("./configuration.json");
var md5 = require("MD5");
var imageModule = require("./image_module");
var step = require("Step");

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server("localhost", 27017, {auto_reconnect: true});
db = new Db("footprint-db", server);

db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'footprint-db' database");
        db.collection('footprint', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'footprint' collection doesn't exist. Creating it with sample data...");
                //populateDB();
            }
        });
    }
});

exports.initialize = function() {
    path.exists(config.assetsPath, function(exists) {
        if (!exists) {
            console.log("Assets path doesn't exist which will be created. " + config.assetsPath);
            mkdirs(config.assetsPath, 0777, function() {
			});
        }
    });   
    path.exists(config.thumbnailPath, function(exists) {
        if (!exists) {
            console.log("Thumbnail path doesn't exist which will be created. " + config.thumbnailPath);
            mkdirs(config.thumbnailPath, 0777, function() {
            });
        }
    });
}
 
exports.findById = function(req, res) {
    var id = req.params.id;
    console.log('Retrieving footprint: ' + id);
    db.collection('footprint', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 
exports.findAll = function(req, res) {
	console.log("API - Find all footprints.");
    db.collection('footprint', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.findFootprintsByDate = function(req, res) {
    var date = req.params.date;
    console.log("API - Find footprints by date: " + date + ".");

    var regexp = /(....)\/(..)\/(..)/;
    if (regexp.matches(date)) {
        var m = regexp.exec(date);
        var min = new Date(m[1], m[2], m[3], 0, 0, 0, 0);
        db.collection('footprint', function(err, collection) {
            collection.find().toArray(function(err, items) {
                res.send(items);
            });
        });    
    } else {
        res.send([]);
    }
};

exports.findTimelineSlots = function(req, res) {
    console.log("API - Find timeline slots.");
    db.collection('footprint', function(err, collection) {
        collection.find({}, {date: true}).sort({isoDate: -1}).toArray(function(err, items) {
            var returnedSlots = {};
            for (var key in items) {
                var v = items[key].date;
                console.log(v);
                var date = v.split(" ")[0];
                var time = v.split(" ")[1];
                if (!(date in returnedSlots)    ) {
                    returnedSlots[date] = new Array();
                }
                returnedSlots[date].push(time);
            };
            res.send(returnedSlots);
        });
    });
}

exports.findGeoCenterByDateTime = function(req, res) {
    var datetime = url.parse(req.url, true).query.datetime;
    console.log("API - Find GEO center by date and time: " + datetime + ".");

    db.collection('footprint', function(err, collection) {
        collection.find({date: datetime}, {latitude: true, longitude: true}).toArray(function(err, items) {
            var first = {};
            console.log(items.length + " footprint items found at " + datetime);
            if (items.length > 0) {
                first = items[0];
            }
            res.send(first);
        });
    });    
}
 
exports.addFootprint = function(req, res) {
    var footprint = req.body;
    var regexp = /(....)\-(..)\-(..) (..):(..)/;
    console.log('Adding footprint: ' + JSON.stringify(footprint));
    db.collection('footprint', function(err, collection) {
        var matches = regexp.exec(footprint.date);

        if (regexp.test(footprint.date)) {
            var isoDate = new Date(matches[1], matches[2] - 1, matches[3], matches[4], matches[5], 0, 0);
            footprint.isoDate = isoDate;
        }

        collection.insert(footprint, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });
}
exports.uploadImage = function(req, res) {
    console.log('Uploading image: ' + JSON.stringify(req.files));
    
    var fileList = req.files.files;
    var countOfFiles = fileList.length;
    console.log(countOfFiles + " files uploaded.");

    var assetsImage = [];

    for (var key in fileList) {
        var file = fileList[key];
        var nameExt = getFileNameAndExtension(file.originalFilename);
        var encodedFilename = md5(nameExt.fileName) + nameExt.ext;

        console.log("File path: " + file.path);
        var newPath = config.assetsPath + encodedFilename;
        fs.rename(file.path, newPath, function (err) {
            if (err != null)
                console.log("ERROR: " + err);
        });

        var assetsFileName = newPath;
        var thumbnailFileName = config.thumbnailPath + encodedFilename;
        console.log("Thumnail path: " + thumbnailFileName);
        step(
            function resize() {
                imageModule.resizeImage(assetsFileName, thumbnailFileName, config.thumbnailHeight, function(error) {
                    if (error != null) {
                        console.log("ERROR: " + error);
                    }
                }); 
            }
        );
 
        assetsImage.push("/assets/" + encodedFilename);
    }
    console.log("Uploaded image: " + assetsImage);
    res.send({imageURL: assetsImage});
}

function getFileNameAndExtension(fileName) {
    var fileNameAndExt = {};
    var lastDotPos = fileName.lastIndexOf(".");
    if (lastDotPos == -1) {
        fileNameAndExt.fileName = fileName;
        fileNameAndExt.ext = "";
    } else {
        fileNameAndExt.fileName = fileName.substring(0, lastDotPos);
        fileNameAndExt.ext = fileName.substring(lastDotPos);
    }

    return fileNameAndExt;
}

exports.updateWine = function(req, res) {
    var id = req.params.id;
    var wine = req.body;
    console.log('Updating wine: ' + id);
    console.log(JSON.stringify(wine));
    db.collection('wines', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, wine, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating wine: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(wine);
            }
        });
    });
}
 
exports.deleteWine = function(req, res) {
    var id = req.params.id;
    console.log('Deleting wine: ' + id);
    db.collection('wines', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });
}

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
        if (!path.existsSync(basePath)) {
            fs.mkdirSync(basePath);
        }
    }
}
