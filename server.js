var config = require('./configuration.json');
var express = require('express');
var path = require('path');
var footprintModule = require("./footprint_module");
var ioutil = require("./ioutil_module");
var logger = require("./logging_module").getLogger(__filename);

ioutil.createDirIfNotExists(config.assetsPath, function(error) {});
ioutil.createDirIfNotExists(config.thumbnailPath, function(error) {});

footprintModule.initializeDatabase(main);

function main() {
    var app = express();

    app.disable("etag");
    app.configure(function() {
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.static(__dirname + "/static"));
    });
 
    app.get('/assets/:name', function(req, res) {
        console.log("Requesting asset " + req.params.name);
        res.sendfile(config.assetsPath + req.params.name);
    });
    app.get('/thumbnail/:name', function(req, res) {
        console.log("Requesting thumbnail" + req.params.name);
        res.sendfile(config.thumbnailPath + req.params.name);
    });

    app.get('/api/get', function(req, res) {
        footprintModule.findAll(req, res);
    });
    app.get('/api/get/:id', function(req, res) {
        footprintModule.findById(req, res);
    });
    app.get('/api/timeline/getTimelineSlots', function(req, res) {
        footprintModule.findTimelineSlots(req, res);
    });
    app.get('/api/timeline/getGeoCenter', function(req, res) {
        footprintModule.findGeoCenterByDateTime(req, res);
    });

    app.post('/api/addFootprint', footprintModule.addFootprint);
    app.post('/api/uploadImage', footprintModule.uploadImage);

    app.listen(config.port);
    logger.debug('Footprint service backend started on port ' + config.port + '...');
}
