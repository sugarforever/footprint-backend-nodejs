var config = require("./configuration.json")
var lwip = require("lwip");
var step = require("Step");
var logger = require("./logging_module").getLogger(__filename);

exports.resizeImage = function(rawImagePath, resizedImagePath, targetHeight, onResizedCallback) {
    lwip.open(rawImagePath, function(error, rawImage) {
        if (error != null) {
            logger.error(error);
            onResizedCallback(error);
            return;
        }
        var rawWidth = rawImage.width();
        var rawHeight = rawImage.height();

        console.log("Raw size: " + rawWidth + "x" + rawHeight);
        var scale = targetHeight / rawHeight;
        console.log("Scale factor: " + scale);
        rawImage.scale(scale, function(err, scaledImage) {
            scaledImage.writeFile(resizedImagePath, {quality: 100}, function(error) {
                if (error != null) {
                    console.log(error);
                }

                onResizedCallback(error);
            });
        }); 
    });
}
 
//module.exports.resizeImage("/var/data/footprint-backend/assets/739bb1bb76b1d0dd068abf77eb2be6cb.jpg", "/Users/apple/Documents/222.JPG", 1024, function() {
//    console.log("done");
//});
