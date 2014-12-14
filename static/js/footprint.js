var footprint = function() {
	this.cacheFootprints = new Array();
	this.cacheLatLngFootprints = new Array();
	this.cacheMarkers = new Array();
	this.blueMarkers = new Array();
	this.cacheMarkersWithFootprintId = new Array();
	this.maxContentInfoLength = 300;
	self = this;
}

footprint.prototype.initialize = function(footprints) {
	if (isArray(footprints)) {
		for (var index = 0; index < footprints.length; ++index) {
			var value = footprints[index];
			
			this.cacheFootprint(value);
		};
	}
}

footprint.prototype.getCachedFootprintsByDate = function(date) {
	var cached = new Array();
	if (date in this.cacheFootprints) {
		cached = this.cacheFootprints[date];
	}
	return cached;
}

footprint.prototype.getCachedFootprintsByLatLng = function(lat, lng) {
	var cached = null;
	if ((lat in this.cacheLatLngFootprints) && (lng in this.cacheLatLngFootprints[lat])) {
		cached = this.cacheLatLngFootprints[lat][lng][0];
	}
	return cached;
}

footprint.prototype.cacheGoogleMarker = function(latitude, longitude, marker) {
	if (! (latitude in this.cacheMarkers)) {
		this.cacheMarkers[latitude] = new Array();
	}

	var longitudeToMakers = this.cacheMarkers[latitude];
	if (! (longitude in longitudeToMakers)) {
		longitudeToMakers[longitude] = new Array();
	}

	longitudeToMakers[longitude].push(marker);
}

footprint.prototype.cacheGoogleMarkerWithFootprintId = function(footprintId, marker) {
	if (! (footprintId in this.cacheMarkersWithFootprintId)) {
		this.cacheMarkersWithFootprintId[footprintId] = marker;
	}
}

footprint.prototype.getGoogleMarkerByFootprintId = function(footprintId) {
	return this.cacheMarkersWithFootprintId[footprintId];
}

footprint.prototype.cacheFootprint = function(footprint) {
	if (footprint == null) {
		return;
	}

	if (! (footprint.date in this.cacheFootprints)) {
		this.cacheFootprints[footprint.date] = new Array();
	}

	this.cacheFootprints[footprint.date].push(footprint);

	var lat = footprint.latitude;
	var lng = footprint.longitude;

	if (! (lat in this.cacheLatLngFootprints)) {
		this.cacheLatLngFootprints[lat] = new Array();
	}

	if (! (lng in this.cacheLatLngFootprints[lat])) {
		this.cacheLatLngFootprints[lat][lng] = new Array();
	}

	this.cacheLatLngFootprints[lat][lng].push(footprint);
}

footprint.prototype.cleanBlueMarkersArray = function() {
	for (var k in this.blueMarkers) {
		var marker = this.blueMarkers[k];
		marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
	}
	this.blueMarkers = [];
}

footprint.prototype.setBlueCachedGoogleMarkersByLatitudeAndLongitude = function(latitude, longitude) {
	var markers = new Array();
	if ((latitude in this.cacheMarkers) && (longitude in this.cacheMarkers[latitude])) {
		markers = this.cacheMarkers[latitude][longitude];
	}

	this.cleanBlueMarkersArray();

	for (var k in markers) {
        markers[k].setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        this.blueMarkers.push(markers[k]);
    }
	return markers;
}

footprint.prototype.setBlueCachedGoogleMarkerByFootprintId = function(footprintId) {
	var marker = null;
	if (footprintId in this.cacheMarkersWithFootprintId) {
		marker = this.cacheMarkersWithFootprintId[footprintId];
	}

	this.cleanBlueMarkersArray();

	if (marker != null) {
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        this.blueMarkers.push(marker);
    }
	return marker;
}

footprint.prototype.createFootprintJSONObject = function(latitude, longitude, timestamp, imageArray, content) {
	var json = {
		latitude: latitude,
		longitude: longitude,
		date: timestamp,
		image: imageArray,
		content: content
	};
	return json;
}

footprint.prototype.setMap = function(googleMap) {
	this.googleMap = googleMap;
	this.projection = this.googleMap.getProjection();
}

footprint.prototype.getMap = function() {
	return this.googleMap;
}

footprint.prototype.getProjection = function() {
	return this.projection;
}

footprint.prototype.getFirstIcon = function(footprint) {
	var firstIcon = null;
	if (footprint != null && footprint.image != null) {
		if (isArray(footprint.image)) {
			firstIcon = footprint.image[0].replace("assets", "icon");
		} else {
			firstIcon = footprint.image.replace("assets", "icon");
		}
	}

	return firstIcon;
}

footprint.prototype.displayFootprintBriefByMarkerAndFootprint = function(marker, footprint) {
	var firstIcon = self.getFirstIcon(footprint);

	var truncatedContent = footprint.content;
	if (truncatedContent.length > self.maxContentInfoLength) {
		truncatedContent = truncatedContent.substr(0, self.maxContentInfoLength - 3) + "...";
	}

	var contentString = '<div id="info-content">'+
	'<h4 id="firstHeading" class="firstHeading">' + footprint.date + '</h4>'+
	'<pre>' + truncatedContent + '</pre>';

	if (firstIcon != null) {
		contentString = contentString +
		'<p><image src="' + firstIcon + '"/></p>';
	}

	contentString = contentString +
	'<p><a href="#" id="view-more">View More</a></p>'+
	'</div>';

	if (this.uniqueInfoWindow == null) {
		//this.uniqueInfoWindow = new google.maps.InfoWindow({maxWidth: 300});
		this.uniqueInfoWindow = new google.maps.InfoWindow();
	}

	if (this.infoWindowListener != null) {
		google.maps.event.removeListener(this.infoWindowListener);
	}

	this.infoWindowListener = google.maps.event.addListener(this.uniqueInfoWindow, 'domready', function () {
		$("#view-more").bind("click", function() {
			google.maps.event.trigger(marker, "click");
		});
	});

	this.uniqueInfoWindow.setContent(contentString);
	this.uniqueInfoWindow.open(map, marker);

}

footprint.prototype.closeInfoWindow = function() {
	if (this.uniqueInfoWindow != null) {
		this.uniqueInfoWindow.close();
	}
}

footprint.prototype.dockBottom = function(docked) {
	var heightOfDocked = $(docked).height();
	var heightOfWindow = $(window).height();

	var offsetTop = heightOfWindow - heightOfDocked;

	$(docked).css("top", offsetTop < 0 ? 0 : offsetTop);
	$(docked).css("left", 0);
}

function extendMapCanvasToFillHeight(selectorsExcluded, mapCanvasSelector) {
	var pixelsExcluded = 0;
	for (key in selectorsExcluded) {
		pixelsExcluded = pixelsExcluded + $(selectorsExcluded[key]).outerHeight();
	}

	//alert(document.body.clientHeight);
	//alert(pixelsExcluded);
	$(mapCanvasSelector).height(document.body.clientHeight - pixelsExcluded);
	$(mapCanvasSelector).css("width", "100%");
}

function loadGoogleMap(callback) {
	var script=document.createElement("script");
	script.type="text/javascript";
	script.async=true;
	script.src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDIekX4pNPTLAON4UFXJfI7YAfUVpliAtY&callback=" + callback;
	document.body.appendChild(script);
}

function isArray(value) {  
	if (typeof Array.isArray  === "function") {  
		return Array.isArray(value);      
	} else {
		return Object.prototype.toString.call(value) === "[object Array]";      
	}  
}

var markerGreen = null;

function createMarker(map, jsonFootprint) {
	var myLatlng = new google.maps.LatLng(jsonFootprint.latitude, jsonFootprint.longitude);
	var marker = new google.maps.Marker({
		position : myLatlng,
		map : map,
		title : jsonFootprint.content,
		labelContent : jsonFootprint.content,
		icon : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
	});

	footprintInstance.cacheGoogleMarkerWithFootprintId(jsonFootprint._id, marker);
	google.maps.event.addListener(marker, "click", function() {
		footprintInstance.closeInfoWindow();

		if (markerGreen != null) {
			markerGreen.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
		}
		marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');

		markerGreen = marker;

		refreshGallery("#gallery-images", jsonFootprint.image, jsonFootprint.date + " " + jsonFootprint.content);
		$("#delete-footprint").attr("footprint-id", jsonFootprint._id);
		$("#gallery-brief").text(jsonFootprint.date);
		$("#gallery-content").text(jsonFootprint.content);

		jQuery(function($) {
        	$(".swipebox").swipebox();
    	});

		/*$( "#image-gallery-dialog" ).on( "beforeposition", function( event, ui ) {
			footprintInstance.dockBottom($("#image-gallery-dialog-popup"));
		} );*/
		$("#image-gallery-dialog").popup("open", {x: 1000000, y:1000000});
	});
	marker.setMap(map);
	footprintInstance.cacheGoogleMarker(jsonFootprint.latitude, jsonFootprint.longitude, marker);

    //alert(fromLatLngToPixel(myLatlng, map, footprintInstance.getProjection()));
}

function fromLatLngToPixel(latLng, map, projection) {
	var numTiles = 1 << map.getZoom();
	var worldCoordinate = projection.fromLatLngToPoint(latLng);
	var pixelCoordinate = new google.maps.Point(
	        worldCoordinate.x * numTiles,
	        worldCoordinate.y * numTiles);

	var topLeft = new google.maps.LatLng(
	    map.getBounds().getNorthEast().lat(),
	    map.getBounds().getSouthWest().lng()
	);

	var topLeftWorldCoordinate = projection.fromLatLngToPoint(topLeft);
	var topLeftPixelCoordinate = new google.maps.Point(
	        topLeftWorldCoordinate.x * numTiles,
	        topLeftWorldCoordinate.y * numTiles);

	return new google.maps.Point(
	        pixelCoordinate.x - topLeftPixelCoordinate.x,
	        pixelCoordinate.y - topLeftPixelCoordinate.y
	)
}

function refreshGallery(galleryDivSelector, imageArray, title) {
	$(galleryDivSelector + " > div.gallery-image-div").remove();	
	if (isArray(imageArray)) {
		$.each(imageArray, function(k, v) {
			appendImageURLTo(galleryDivSelector, v, title);
		});
	} else if (typeof imageArray !== 'undefined') {
		appendImageURLTo(galleryDivSelector, imageArray, title);
	}
}

function appendImageURLTo(parentSelector, imageURL, title) {
    var thumbnailImage = imageURL.replace("assets", "thumbnail");
	var img = $('<img class="gallery-image" />');
	$(img).load(function() {
		/*$("#image-gallery-dialog").position({
		    of: $(window)
		});*/
		footprintInstance.dockBottom($("#image-gallery-dialog-popup"));
	});
	//$(img).attr("src", imageURL);
	$(img).attr("src", thumbnailImage);
	var a = $('<a class="swipebox" href="' + imageURL + '" title="' + title + '"></a>');
	var div = $('<div class="gallery-image-div"></div>');
	img.appendTo(a);
	a.appendTo(div);
	$(parentSelector).append(div);
}

function supplementToDoubleDigits(v) {
	if (v < 10) {
		return "0" + v;
	} else {
		return v;
	}
}

function setCurrentDateTime(selecter) {
	var date = new Date();
	var str = date.getFullYear() + "-" + supplementToDoubleDigits((date.getMonth() + 1)) + "-" + supplementToDoubleDigits(date.getDate()) + " " + supplementToDoubleDigits(date.getHours()) + ":" + supplementToDoubleDigits(date.getMinutes());
	$(selecter).attr("value", str);
}

function generateTimelineSlotListView(listviewSelector, callback) {
	$(listviewSelector).empty();
	$.get("/api/timeline/getTimelineSlots", function(response) {
		$.each(response, function(date, value) {
			var div = $('<div data-role="collapsible"></div>');
			$(div).append('<h3>' + date + '</h3>');
			
            $.each(value, function(key, timeAndContent) {
            	var time = timeAndContent.time;
            	var content = timeAndContent.content;
            	var a = $('<a href="#" class="block-style">' + time + '</a><p class="timeslot-content">' + content + "</p>");
            	var dateTime = date + " " + time;

            	$(a).bind("click", function() {
            		//$.get("/api/timeline/getGeoCenter", {datetime: date + " " + time}, function(response) {    
		            // 	var ll = new google.maps.LatLng(response.latitude, response.longitude);
                    //	map.setCenter(ll);
		            //});
            		var cachedFootprints = footprintInstance.getCachedFootprintsByDate(dateTime);
            		if (cachedFootprints.length > 0) {
            			var first = cachedFootprints[0];
            			var ll = new google.maps.LatLng(first.latitude, first.longitude);
            			map.setCenter(ll);
            		}

            		for (var index = 0; index < cachedFootprints.length; ++index) {
            			var fp = cachedFootprints[index];
            			//var markers = footprintInstance.setBlueCachedGoogleMarkersByLatitudeAndLongitude(fp.latitude,fp.longitude);
            			var marker = footprintInstance.setBlueCachedGoogleMarkerByFootprintId(fp._id);
            			footprintInstance.displayFootprintBriefByMarkerAndFootprint(marker, fp);
            		}
            	});
            	$(div).append(a);
            });
			$(listviewSelector).append(div);
		});

		$(listviewSelector).trigger('create');

		callback();
	});
}
