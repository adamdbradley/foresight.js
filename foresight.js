; ( function ( window, document ) {
	"use strict";

	window.foresight = window.foresight || {};

	// properties
	var fs = window.foresight;
	fs.devicePixelRatio = ( ( window.devicePixelRatio && window.devicePixelRatio > 1 ) ? window.devicePixelRatio : 1 );
	fs.availWidth = window.screen.availWidth;
	fs.availHeight = window.screen.availHeight;
	fs.isHighSpeedConn = false;
	fs.connKbps = 0;
	fs.connTestMethod = undefined;
	fs.log = [],
	fs.images = [];

	// options
	fs.options = fs.options || {};
	var opts = fs.options;
	opts.imgClassName = opts.imgClassName || 'responsive-img';
	opts.srcModification = opts.srcModification || 'rebuildSrc';
	opts.srcFormat = opts.srcFormat || '{protocol}://{host}{directory}{file}';
	opts.testConn = opts.testConn || true;
	opts.minKbpsForHighSpeedConn = opts.minKbpsForHighSpeedConn || 800;
	opts.speedTestUri = opts.speedTestUri || '//foresightjs.appspot.com/speed-test/100K.jpg';
	opts.speedTestKB = opts.speedTestKB || 100;
	opts.speedTestExpireMinutes = opts.speedTestExpireMinutes || 30;
	opts.maxImgWidth = opts.maxImgWidth || 1200;
	opts.maxImgHeight = opts.maxImgHeight || opts.maxImgWidth;
	opts.maxImgRequestWidth = opts.maxImgRequestWidth || 2048;
	opts.maxImgRequestHeight = opts.maxImgRequestHeight || opts.maxImgRequestWidth;
	opts.forcedPixelRatio = opts.forcedPixelRatio;
	opts.debug = opts.debug || false; 

	var
	imageIterateStatus,
	speedConnectionStatus,
	STATUS_LOADING = 'loading',
	STATUS_COMPLETE = 'complete',
	localStorageKey = 'foresight.js',

	initIterateImages = function() {
		if ( imageIterateStatus ) return;
		log('initElementIteration');

		imageIterateStatus = STATUS_LOADING;

		var 
		x,
		img;
		for( x = 0; x < document.images.length; x++ ) {
			img = document.images[ x ];
			if ( img.className.indexOf(opts.imgClassName) > -1 ) {
				setImage( img );
			}
		}

		imageIterateStatus = STATUS_COMPLETE;

		initImageRebuild();
	},

	initSpeedTest = function() {
		log('initSpeedTest');
		// only check the connection speed once, if there is a status we already got info or it already started
		if ( speedConnectionStatus ) return;

		// if the device pixel ratio is 1, then no need to do a speed test
		if ( fs.devicePixelRatio == 1 ) {
			fs.connTestMethod = 'skip';
			speedConnectionStatus = STATUS_COMPLETE;
			return;
		}

		// check if a speed test has recently been completed and data saved in the local storage
		// localStorage.removeItem( localStorageKey );
		try {
			var fsData = JSON.parse( localStorage.getItem( localStorageKey ) );
			if ( fsData && fsData.isHighSpeedConn ) {
				var minuteDifference = ( ( new Date() ).getTime() - fsData.timestamp ) / 1000 / 60;
				if ( minuteDifference < opts.speedTestExpireMinutes ) {
					// already have connection data without our desired timeframe, use this instead of another test
					fs.isHighSpeedConn = true;
					fs.connKbps = fsData.connKbps;
					fs.connTestMethod = 'localStorage';
					speedConnectionStatus = STATUS_COMPLETE;
					return;
				}
			}
		} catch( e ) { }

		var 
		speedTestImg = document.createElement( 'img' ),
		endTime,
		startTime,
		speedTestTimeoutMS;

		speedTestImg.onload = function() {
			// speed test image download completed
			endTime = ( new Date() ).getTime();

			var duration = round( ( endTime - startTime ) / 1000 );
			duration = ( duration > 1 ? duration : 1 );

			var bitsLoaded = ( opts.speedTestKB * 1024 * 8 );
			fs.connKbps = ( round( bitsLoaded / duration ) / 1024 );
			fs.isHighSpeedConn = ( fs.connKbps >= opts.minKbpsForHighSpeedConn );

			speedTestComplete( 'network' );
		};

		speedTestImg.onerror = function() {
			// fallback incase there was an error downloading the speed test image
			speedTestComplete( 'networkError' );
		};

		// begin the speed test image download
		startTime = ( new Date() ).getTime();
		speedConnectionStatus = STATUS_LOADING;
		speedTestImg.src = opts.speedTestUri + "?r=" + Math.random();

		// calculate the maximum number of milliseconds it 'should' take to download an XX Kbps file
		// set a timeout so that if the speed testdownload takes too long (plus 250ms for benefit of the doubt)
		// than it isn't a high speed connection and ignore what the test image .onload has to say
		speedTestTimeoutMS = ( ( ( opts.speedTestKB * 8 ) / opts.minKbpsForHighSpeedConn ) * 1000 ) + 250;
		setTimeout( function() {
			speedTestComplete( 'networkSlow' );
		}, speedTestTimeoutMS );
	},

	speedTestComplete = function( connTestMethod ) {
		// if we haven't already gotten a speed connection status then save the info
		if(speedConnectionStatus === STATUS_COMPLETE) return;
		log('speedTestComplete: ' + connTestMethod);

		fs.connTestMethod = connTestMethod;

		try {
			var fsDataToSet = {
				connKbps: fs.connKbps,
				isHighSpeedConn: fs.isHighSpeedConn,
				timestamp: ( new Date() ).getTime()
			};
			localStorage.setItem( localStorageKey, JSON.stringify( fsDataToSet ) );
		} catch( e ) { }

		speedConnectionStatus = STATUS_COMPLETE;
		initImageRebuild();
	},

	setImage = function ( img ) {
		log('setImage');

		fillProp( img, 'src', 'orgSrc' ); // important, do not set the src attribute yet!
		img.orgWidth = img.width;
		img.orgHeight = img.height;

		if ( !img.orgSrc || !img.width || !img.height ) return; // missing required attributes

		fillProp( img, 'max-width', 'maxWidth', true, opts.maxImgWidth );
		fillProp( img, 'max-height', 'maxHeight', true, opts.maxImgHeight );

		fillProp( img, 'max-request-width', 'maxRequestWidth', true, opts.maxImgRequestWidth );
		fillProp( img, 'max-request-height', 'maxRequestHeight', true, opts.maxImgRequestHeight );

		fillProp( img, 'win-width-percent', 'winWidthPercent', true, 0 );
		fillProp( img, 'win-height-percent', 'winHeightPercent', true, 0 );
		setDimensionsFromPercent( img );

		// ensure the img dimensions do not exceed the max, scale proportionally
		maxDimensionScaling( img, 'width', 'maxWidth', 'height', 'maxHeight' );

		fillProp( img, 'src-modification', 'srcModification', false, opts.srcModification );
		fillProp( img, 'src-format', 'srcFormat', false, opts.srcFormat );
		fillProp( img, 'pixel-ratio', 'pixelRatio', true, fs.devicePixelRatio );

		// add this image to the collection, but do not add it to the DOM yet
		fs.images.push( img );
	},

	fillProp = function( img, attrName, propName, getFloat, defaultValue ) {
		// standard function to fill up an <img> with data from the <noscript>
		var value = img.getAttribute( 'data-' + attrName );
		if ( value && value !== '' ) {
			if ( getFloat ) {
				value = value.replace( '%', '' );
				if( !isNaN( value ) ) {
					value = parseFloat( value, 10 );
				}
			}
		} else {
			value = defaultValue;
		}
		img[ propName ] = value;
	},

	setDimensionsFromPercent = function( img ) {
		if ( img.winWidthPercent > 0 ) {
			var orgW = img.width;
			img.width = round( (img.winWidthPercent / 100) * fs.availWidth );
			img.height = round( img.height * ( img.width / orgW ) );
		} else if ( img.winHeightPercent > 0 ) {
			var orgH = img.height;
			img.height = round( (img.winHeightPercent / 100) * fs.availHeight );
			img.width = round( img.width * ( img.height / orgH ) );
		}
	},

	initImageRebuild = function() {
		log('initImageRebuild');
		// if both the speed connection test and we've looped through the entire DOM, then rebuild the image src
		if ( speedConnectionStatus === STATUS_COMPLETE && imageIterateStatus === STATUS_COMPLETE ) {

			var
			x,
			img;

			for ( x = 0; x < fs.images.length; x++ ) {
				img = fs.images[ x ];

				img.requestWidth = round( img.width * img.pixelRatio );
				img.requestHeight = round( img.height * img.pixelRatio );

				// ensure the request dimensions do not exceed the max, scale proportionally
				maxDimensionScaling( img, 'requestWidth', 'maxRequestWidth', 'requestHeight', 'maxRequestHeight' );

				// decide how the src should be modified for the new image request
				if ( img.srcModification === 'rebuildSrc' && img.srcFormat ) {
					rebuildSrc( img );
				} else {
					// default: replaceDimensions
					replaceDimensions( img );
				}
			}

			if ( fs.oncomplete ) {
				fs.oncomplete();
			}
		}
	},

	maxDimensionScaling = function( img, widthProp, maxWidthProp, heightProp, maxHeightProp ) {
		// used to ensure both the width and height do not go over the max allowed
		// this function is reusable for both the img width/height, and the request width/height
		var orgD;
		if ( img[ widthProp ] > img[ maxWidthProp ] ) {
			orgD = img[ widthProp ];
			img[ widthProp ] = img[ maxWidthProp ];
			img[ heightProp ] = round( img[ heightProp ] * ( img[ widthProp ] / orgD ) );
		}
		if ( img[ heightProp ] > img[ maxHeightProp ] ) {
			orgD = img[ heightProp ];
			img[ heightProp ] = img[ maxHeightProp ];
			img[ widthProp ] = round( img[ widthProp ] * ( img[ heightProp ] / orgD ) );
			if ( img[ widthProp ] > img[ maxWidthProp ] ) {
				orgD = img.img[ widthProp ];
				img[ widthProp ] = img[ maxWidthProp ];
				img[ heightProp ] = round( img[ heightProp ] * ( img[ widthProp ] / orgD ) );
			}
		}
	},

	rebuildSrc = function( img ) {
		// rebuild the <img> src using the supplied format and image data
		var
		f,
		formatReplace = [ 'protocol', 'host', 'port', 'directory', 'file', 'filename', 'ext', 'query', 'requestWidth', 'requestHeight', 'pixelRatio' ],
		newSrc = img.srcFormat;

		img.uri = parseUri( img.orgSrc );
		img.uri.requestWidth = img.requestWidth;
		img.uri.requestHeight = img.requestHeight;
		img.uri.pixelRatio = img.pixelRatio;
		
		for ( f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img.uri[ formatReplace[ f ] ] );
		}
		img.src = newSrc; // set the new src, begin downloading this image
	},

	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	parseUri = function( str ) {
		var o = {
			key: [ "source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor" ],
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

		var fileSplt = uri.file.split('.');
		uri.filename = fileSplt[ 0 ];
		uri.ext = ( fileSplt.length > 1 ? fileSplt[ fileSplt.length -1 ] : '' );

		return uri;
	},

	replaceDimensions = function( img ) {
		// replace image dimensions already in the src with new dimensions
		// set the new src, begin downloading this image
		img.src = img.orgSrc
					.replace( img.orgWidth, img.requestWidth )
					.replace( img.orgHeight, img.requestHeight );
	},

	round = function( value ) {
		// used just for smaller javascript after minify
		return Math.round( value );
	},

	log = function( msg ) {
		if( !opts.debug ) return;
		var dt = new Date();
		msg += ' -- ' + dt.getMinutes() + ':' +  dt.getSeconds() + ':' +  dt.getMilliseconds();
		fs.log.push( msg );
	};
	
	if( opts.forcedPixelRatio ) {
		// force a certain pixel ratio in the options
		fs.devicePixelRatio = opts.forcedPixelRatio;
	}

	// when the DOM is ready, begin iterating through each element in the DOM
	if ( document.readyState === STATUS_COMPLETE ) {
		log('document.readyState === STATUS_COMPLETE');
		initIterateImages();
	} else {
		if ( document.addEventListener ) {
			log('document.addEventListener');
			document.addEventListener( "DOMContentLoaded", initIterateImages, false );
			window.addEventListener( "load", initIterateImages, false );

		} else if ( document.attachEvent ) {
			log('document.attachEvent');
			document.attachEvent( "onreadystatechange", initIterateImages );
			window.attachEvent( "onload", initIterateImages );
		}
	};

	// DOM does not need to be ready to begin the network connection speed test
	initSpeedTest();

} ( this, document ) );