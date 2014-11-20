var footprint = function() {
	this.cacheFootprints = new Array();
	this.cacheMarkers = new Array();
}

footprint.prototype.initialize = function(footprints) {
	if (isArray(footprints)) {
		for (var index = 0; index < footprints.length; ++index) {
			var value = footprints[index];
			if (! (value.date in this.cacheFootprints)) {
				this.cacheFootprints[value.date] = new Array();
			}

			this.cacheFootprints[value.date].push(value);
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

footprint.prototype.findCachedGoogleMarkersByLatitudeAndLongitude = function(latitude, longitude) {
	var markers = new Array();
	if ((latitude in this.cacheMarkers) && (longitude in this.cacheMarkers[latitude])) {
		markers = this.cacheMarkers[latitude][longitude];
	}

	return markers;
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

function createMarker(map, latitude, longitude, timestamp, imageArray, content) {
	var myLatlng = new google.maps.LatLng(latitude, longitude);
	var marker = new google.maps.Marker({
		position : myLatlng,
		map : map,
		title : content,
		labelContent : content,
		icon : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
	});

	google.maps.event.addListener(marker, "click", function() {
		if (markerGreen != null) {
			markerGreen.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
		}
		marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');

		markerGreen = marker;

		refreshGallery("#gallery-images", imageArray, timestamp + " " + content);
		$("#gallery-brief").text(timestamp);
		$("#gallery-content").text(content);

		jQuery(function($) {
        	$(".swipebox").swipebox();
    	});

		$("#image-gallery-dialog").popup("open");
	});
	marker.setMap(map);
	footprintInstance.cacheGoogleMarker(latitude, longitude, marker);
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
	var img = $('<img class="gallery-image" />');
	$(img).load(function() {
		$("#image-gallery-dialog").position({
		    of: $(window)
		});
	});
	$(img).attr("src", imageURL);
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
	var str = date.getFullYear() + "/" + supplementToDoubleDigits((date.getMonth() + 1)) + "/" + supplementToDoubleDigits(date.getDate()) + " " + supplementToDoubleDigits(date.getHours()) + ":" + supplementToDoubleDigits(date.getMinutes());
	$(selecter).attr("value", str);
}

function generateTimelineSlotListView(listviewSelector, callback) {
	$(listviewSelector).empty();
	$.get("/api/timeline/getTimelineSlots", function(response) {
		$.each(response, function(date, value) {
			var div = $('<div data-role="collapsible"></div>');
			$(div).append('<h3>' + date + '</h3>');
			
            $.each(value, function(key, time) {
            	var a = $('<a href="#" class="block-style">' + time + '</a>');
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
            			var markers = footprintInstance.findCachedGoogleMarkersByLatitudeAndLongitude(fp.latitude,fp.longitude);
            			for (var k in markers) {
            				markers[k].setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
            			}
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