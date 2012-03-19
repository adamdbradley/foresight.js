; ( function ( window, document ) {
    "use strict";

	window.foresight = window.foresight || {};

	// properties
	foresight.devicePixelRatio = 2;//((window.devicePixelRatio && window.devicePixelRatio > 1) ? window.devicePixelRatio : 1);
	foresight.isHighSpeedConnection = false;
	foresight.connectionKbps = undefined;
	foresight.images = [];
	foresight.log = [];
	foresight.oncomplete = foresight.oncomplete || undefined;

	// options
	foresight.options = foresight.options || {};
	foresight.options.resizeMethod = foresight.options.resizeMethod || 'rebuildSrc';
	foresight.options.resizeSrcFormat = foresight.options.resizeSrcFormat || '{protocol}://{host}{directory}{file}';
	foresight.options.checkConnection = foresight.options.checkConnection || true;
	foresight.options.minKbpsForHighSpeedConnection = foresight.options.minKbpsForHighSpeedConnection || 400;
	foresight.options.speedTestUri = foresight.options.speedTestUri || 'speed-test/100K';
	foresight.options.speedTestKB = foresight.options.speedTestKB || 100;
	foresight.options.speedTestExpireMinutes = foresight.options.speedTestExpireMinutes || 30;

	var
	imageIterateStatus,
	speedConnectionStatus,

	log = function ( msg ) {
		//return;
		foresight.log.push(msg);
	},

	initScan = function() {
		if ( imageIterateStatus ) return;

		imageIterateStatus = 'LOADING';
		iterateChildElements( document.body );
		imageIterateStatus = 'COMPLETE';

		if ( foresight.images.length > 0 ) {
			initImageRebuild();
		} else {
			if (foresight.oncomplete) {
				foresight.oncomplete();
			}
		}
	},

	iterateChildElements = function ( parentEle ) {
		if ( !parentEle ) return;

		var
		x,
		l = parentEle.childNodes.length,
		childEle;

		for ( x = 0; x < l; x++ ) {
			childEle = parentEle.childNodes[x];

			if (childEle.nodeName !== '#text') {
				if (childEle.nodeName === 'NOSCRIPT') {
					if (childEle.getAttribute( 'data-img-src' ) !== null) {
						setImage( childEle );
					}
				} else if ( childEle.hasChildNodes ) {
					iterateChildElements( childEle );
				}
			}
		}
	},

	initSpeedTest = function() {
		// only check the connection speed once, if there is a status we already got info or it started already
		if ( speedConnectionStatus ) return;

		// if the device pixel ratio is 1, then no need to check
		if ( foresight.devicePixelRatio == 1 ) {
			log('pixel ratio = 1, no speed test');
			speedConnectionStatus = 'COMPLETE';
			return;
		}

		// set if a speed test has recently been completed in the global storage
		//localStorage.removeItem('foresight.js')
		try {
			var fsData = JSON.parse( localStorage.getItem("foresight.js") );
			if ( fsData && fsData.isHighSpeedConnection ) {
				var minuteDifference = ( (new Date()).getTime() - fsData.timestamp ) / 1000 / 60;
				if (minuteDifference < foresight.options.speedTestExpireMinutes) {
					log('localStorage fsData, no speed test');
					foresight.isHighSpeedConnection = true;
					foresight.connectionKbps = fsData.connectionKbps;
					speedConnectionStatus = 'COMPLETE';
					return;
				}
			}
		} catch( e ) { }

		var 
		speedTestImg = new Image(),
		endTime,
		startTime;

		speedTestImg.onload = function() {
			// image download completed
			endTime = ( new Date() ).getTime();

			var duration = Math.round( (endTime - startTime) / 1000 );
			duration = (duration > 1 ? duration : 1);

			var bitsLoaded = ( foresight.options.speedTestKB * 1024 * 8 );

			foresight.connectionKbps = ( Math.round(bitsLoaded / duration) / 1024 );

			foresight.isHighSpeedConnection = ( foresight.connectionKbps >= foresight.options.minKbpsForHighSpeedConnection );

			try {
				var fsDataToSet = {
					connectionKbps: foresight.connectionKbps,
					isHighSpeedConnection: foresight.isHighSpeedConnection,
					timestamp: endTime
				};
				localStorage.setItem("foresight.js", JSON.stringify( fsDataToSet ) );
			} catch( e ) { }

			speedConnectionStatus = 'COMPLETE';

			log('completed speed test');
			initImageRebuild();
		};

		// begin the speed test image download
		startTime = ( new Date() ).getTime();
		speedConnectionStatus = 'LOADING';
		log('start speed test');
		speedTestImg.src = foresight.options.speedTestUri + "?r=" + Math.random();
	},

	setImage = function ( noScriptEle ) {
		
		// this will only run once
		initSpeedTest();

		var img = document.createElement('img');
		img.noScriptEle = noScriptEle;

		fillProp( img, 'src', 'orgSrc' );
		fillProp( img, 'width', 'orgWidth', true );
		fillProp( img, 'height', 'orgHeight', true );

		if ( !img.orgSrc || !img.orgWidth || !img.orgHeight ) {
			return;
		}

		fillProp( img, 'class', 'className' );
		fillProp( img, 'resize-method', 'resizeMethod', false, foresight.options.resizeMethod );
		fillProp( img, 'src-format', 'resizeSrcFormat', false, foresight.options.resizeSrcFormat );
		fillProp( img, 'pixel-ratio', 'pixelRatio', true, foresight.devicePixelRatio );
		fillProp( img, 'id', 'id', false, ('fsImg' + Math.floor( Math.random() * 1000000000) ) );

		foresight.images.push( img );
	},

	fillProp = function( img, attrName, propName, getFloat, defaultValue ) {
		var value = img.noScriptEle.getAttribute('data-img-' + attrName);
		if ( value && value !== '' ) {
			if ( getFloat ) {
				value = parseFloat( value, 10 );
			}
		} else {
			value = defaultValue;
		}
		img[propName] = value;
	},

	initImageRebuild = function() {
		if ( speedConnectionStatus !== 'COMPLETE' || imageIterateStatus !== 'COMPLETE' ) {
			return;
		}
		
		var
		x,
		img;

		for ( x = 0; x < foresight.images.length; x++ ) {
			img = foresight.images[x];

	        img.width = Math.round( img.orgWidth * img.pixelRatio );
		    img.height = Math.round( img.orgHeight * img.pixelRatio );

			log('---IMG ' + x + ', ID: ' + img.id);
			log('org src: ' + img.orgSrc);
		    log('org: ' + img.orgWidth + 'x' + img.orgHeight + '  --  new: ' + img.width + 'x' + img.height);
			log('pixel ratio: ' + img.pixelRatio);

		    if ( img.resizeMethod === 'rebuildSrc' && img.resizeSrcFormat ) {
				log('rebuildSrc, format: ' + img.resizeSrcFormat);
				rebuildSrc(img);
		    } else if ( img.resizeMethod === 'replaceDimensions' ) {
				log('replaceDimensions');
				replaceDimensions( img );
		    } else {
				log('error resize method');
				return;
			}

		    log('new src: ' + img.src);
			
		}

		insertImages();
	},
	
	rebuildSrc = function( img ) {
		img.uri = parseUri( img.orgSrc );
		img.uri.width = img.width;
		img.uri.height = img.height;
		img.uri.pixelRatio = img.pixelRatio;
		var formatReplace = [ 'protocol', 'host', 'port', 'directory', 'file', 'query', 'width', 'height', 'pixelRatio' ];
		var newSrc = img.resizeSrcFormat;
		for ( var f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[f] + '}', img.uri[formatReplace[f]] );
		}
		img.src = newSrc;
	},

	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	parseUri = function( str ) {
		var o = {
			key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
			q: {
				name: "queryKey",
				parser: /(?:^|&)([^&=]*)=?([^&]*)/g
			},
			parser: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		},
		m = o.parser.exec( str ),
		uri = {},
		i = 14;

		while (i--) uri[o.key[i]] = m[i] || "";

		uri[o.q.name] = {};
		uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
			if ($1) uri[o.q.name][$1] = $2;
		});

		return uri;
	},

	replaceDimensions = function( img ) {
		img.uri = undefined;
		img.src = img.orgSrc
					.replace( img.orgWidth, img.width )
					.replace( img.orgHeight, img.height );
	},

	insertImages = function() {	
		var
		x,
		img;

		for ( x = 0; x < foresight.images.length; x++ ) {
			img = foresight.images[x];
			img.noScriptEle.parentElement.insertBefore( img, img.noScriptEle );
		}

		if ( foresight.oncomplete ) {
			foresight.oncomplete();
		}
	};

	if ( document.readyState === "complete" ) {
		initScan();

	} else {

		if ( document.addEventListener ) {
			document.addEventListener( "DOMContentLoaded", initScan, false );
			window.addEventListener( "load", initScan, false );

		} else if ( document.attachEvent ) {
			document.attachEvent( "onreadystatechange", initScan );
			window.attachEvent( "onload", initScan );
		}
	};
} ( this, document )) ;