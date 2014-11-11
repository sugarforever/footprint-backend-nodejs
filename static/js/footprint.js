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

function createMarker(map, latitude, longitude, timestamp, brief, imageArray, content) {
	var myLatlng = new google.maps.LatLng(latitude, longitude);
	var marker = new google.maps.Marker({
		position : myLatlng,
		map : map,
		title : brief,
		icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
	});

	google.maps.event.addListener(marker, "click", function() {
		marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');

		if (markerGreen != null) {
			markerGreen.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
		}
		markerGreen = marker;

		refreshGallery("#imageGallery", imageArray, timestamp + " " + brief);
		$("#gallery-brief").text(timestamp + " " + brief);
		$("#gallery-content").text(content);

		jQuery(function($) {
        	$(".swipebox").swipebox();
    	});

		$("#btnImageGallery").click();
	});
	marker.setMap(map);
}

function refreshGallery(galleryDivSelector, imageArray, title) {
	$(galleryDivSelector + " > a.swipebox").remove();	
	if (isArray(imageArray)) {
		$.each(imageArray, function(k, v) {
			appendImageURLTo(galleryDivSelector, v, title);
		});
	} else {
		appendImageURLTo(galleryDivSelector, imageArray, title);
	}
}

function appendImageURLTo(parentSelector, imageURL, title) {
	$(parentSelector).append('<a class="swipebox" href="' + imageURL + '" title="' + title + '"><img src="' + imageURL + '" height=100></a>');
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
            	$(a).bind("click", function() {
            		$.get("/api/timeline/getGeoCenter", {datetime: date + " " + time}, function(response) {    
		             	var ll = new google.maps.LatLng(response.latitude, response.longitude);
                    	map.setCenter(ll);
		            });
            	});
            	$(div).append(a);
            });
			$(listviewSelector).append(div);
		});

		$(listviewSelector).trigger('create');

		callback();
	});
}