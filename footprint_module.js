var mongo = require("mongodb");
var url = require("url");
var fs = require("fs");
var path = require("path");
var config = require("./configuration.json");
var md5 = require("MD5");
var imageModule = require("./image_module");
var step = require("step");
var logger = require("./logging_module").getLogger(__filename);

var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;

var server = new Server(config.mongo.server, config.mongo.port, {auto_reconnect: config.mongo.autoReconnect});
var db;

exports.initializeDatabase = function(callback) {
    db = new Db(config.mongo.database, server);
    db.open(function(err, db) {
        if(!err) {
            logger.debug("Connected to '" + config.mongo.database + "' database");
            db.collection(config.mongo.footprintCollection, {strict:true}, function(err, collection) {
                if (err) {
                    logger.error("The '" + config.mongo.footprintCollection + "' collection doesn't exist.");
                    //populateDB();
                }
            });

            callback();
        } else {
            logger.error(err);
        }
    });
}

exports.findById = function(req, res) {
    var id = req.params.id;
    logger.debug('Retrieving footprint: ' + id);
    db.collection(config.mongo.footprintCollection, function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });
};
 
exports.findAll = function(req, res) {
    logger.debug("API - Find all footprints.");
    db.collection(config.mongo.footprintCollection, function(err, collection) {
        collection.find({deleted: {$ne: true}}).toArray(function(err, items) {
            res.send(items);
        });
    });
};

exports.findFootprintsByDate = function(req, res) {
    var date = req.params.date;
    logger.debug("API - Find footprints by date: " + date + ".");

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
    logger.debug("API - Find timeline slots.");
    db.collection(config.mongo.footprintCollection, function(err, collection) {
        collection.find({deleted: {$ne: true}}, {date: true, content: true}).sort({isoDate: -1}).toArray(function(err, items) {
            var returnedSlots = {};
            for (var key in items) {
                var v = items[key].date;
                logger.debug("Date time: " + v);
                var date = v.split(" ")[0];
                var time = v.split(" ")[1];
                if (!(date in returnedSlots)    ) {
                    returnedSlots[date] = new Array();
                }
                returnedSlots[date].push({time: time, content: items[key].content});
            };
            res.send(returnedSlots);
        });
    });
}

exports.findGeoCenterByDateTime = function(req, res) {
    var datetime = url.parse(req.url, true).query.datetime;
    logger.debug("API - Find GEO center by date and time: " + datetime + ".");

    db.collection(config.mongo.footprintCollection, function(err, collection) {
        collection.find({date: datetime}, {latitude: true, longitude: true}).toArray(function(err, items) {
            var first = {};
            logger.debug(items.length + " footprint items found at " + datetime);
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
    logger.debug('Adding footprint: ' + JSON.stringify(footprint));
    db.collection(config.mongo.footprintCollection, function(err, collection) {
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

exports.deleteFootprint = function(req, res) {
    var _id = req.params.id;
    logger.debug("Delete footprint with _id: " + _id);
    db.collection(config.mongo.footprintCollection, function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(_id)}, { $set:
                { deleted:true }
            }, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                logger.debug(result + ' document(s) updated with setting deleted as true.');
                res.send(req.body);
            }
        });
    });
}
exports.uploadImage = function(req, res) {
    logger.debug('Uploading image: ' + JSON.stringify(req.files));
    
    var fileList = req.files.files;
    var countOfFiles = fileList.length;
    logger.debug(countOfFiles + " files uploaded.");

    var assetsImage = [];

    for (var key in fileList) {
        var file = fileList[key];
        var nameExt = getFileNameAndExtension(file.originalFilename);
        var encodedFilename = getEncodedFileName(file.path, nameExt.ext);

        logger.debug("File path: " + file.path);
        var newPath = config.assetsPath + encodedFilename;
        fs.rename(file.path, newPath, function (err) {
            if (err != null) {
                logger.error(err);
            }
        });

        var assetsFileName = newPath;
        var thumbnailFileName = config.thumbnailPath + encodedFilename;
        var iconFileName = config.iconPath + encodedFilename;
        logger.debug("Thumnail path: " + thumbnailFileName);
        logger.debug("Icon path: " + iconFileName);
        step(
            function resizeForThumbnail() {
                imageModule.resizeImage(assetsFileName, thumbnailFileName, config.thumbnailHeight, function(error) {
                    if (error != null) {
                        logger.error(error);
                    }
                });
                imageModule.resizeImage(assetsFileName, iconFileName, config.iconHeight, function(error) {
                    if (error != null) {
                        logger.error(error);
                    }
                }); 
            }
        );
 
        assetsImage.push("/assets/" + encodedFilename);
    }
    logger.debug("Uploaded image: " + assetsImage);
    res.send({imageURL: assetsImage});
}

function getEncodedFileName(uploadedFilePath, fileExt) {
    return module.exports.getCurrentUser() + new Date().getTime() + md5(uploadedFilePath) + fileExt;
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

exports.getCurrentUser = function(req) {
    return "";
}
