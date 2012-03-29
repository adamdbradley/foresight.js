/*
 * Foresight.js 1.0.1 Copyright (c) 2012, Adam Bradley
 * Available via the MIT license.
 * For details see: https://github.com/adamdbradley/foresight.js
 */

; ( function ( foresight, window, document, navigator ) {
	"use strict";

	// properties
	foresight.devicePixelRatio = ( ( window.devicePixelRatio && window.devicePixelRatio > 1 ) ? window.devicePixelRatio : 1 );
	foresight.isHighSpeedConn = false;
	foresight.hiResEnabled = false;
	foresight.connKbps;
	foresight.connTestResult;
	foresight.connType;
	foresight.images = [];

	// options
	foresight.options = foresight.options || {};
	var opts = foresight.options,
	srcModification = opts.srcModification || 'replaceDimensions',
	srcUriTemplate = opts.srcUriTemplate || '{protocol}://{host}{directory}{file}',
	testConn = opts.testConn || true,
	minKbpsForHighSpeedConn = opts.minKbpsForHighSpeedConn || 400,
	speedTestUri = opts.speedTestUri || 'http://foresightjs.appspot.com/speed-test/50K.jpg',
	speedTestKB = opts.speedTestKB || 50,
	speedTestExpireMinutes = opts.speedTestExpireMinutes || 30,
	maxBrowserWidth = opts.maxBrowserWidth || 1024,
	maxBrowserHeight = opts.maxBrowserHeight || maxBrowserWidth,
	maxRequestWidth = opts.maxRequestWidth || 2048,
	maxRequestHeight = opts.maxRequestHeight || maxRequestWidth,
	forcedPixelRatio = opts.forcedPixelRatio,

	// used to keep track of the progress status for finding foresight 
	// images in the DOM and connection test results
	imageIterateStatus,
	speedConnectionStatus,

	// for minification purposes
	STATUS_LOADING = 'loading',
	STATUS_COMPLETE = 'complete',
	LOCAL_STORAGE_KEY = 'fsjs',
	TRUE = true,
	FALSE = false,

	initForesight = function () {
		// begin finding valid foresight <img>'s and updating their src's
		if ( imageIterateStatus ) return;

		imageIterateStatus = STATUS_LOADING;
		initImages();
		imageIterateStatus = STATUS_COMPLETE;

		initImageRebuild();
	},

	initImages = function () {
		// loop through each of the document.images and find valid foresight images
		var
		x,
		img;

		for ( x = 0; x < document.images.length; x ++ ) {
			img = document.images[ x ];

			// initialize some properties the image will use
			if ( !img.initalized ) {
				// only gather the images that haven't already been initialized
				img.initalized = TRUE;

				fillImgProperty( img, 'src', 'orgSrc' ); // important, do not set the src attribute yet!
				fillImgProperty( img, 'width', 'browserWidth' );
				fillImgProperty( img, 'height', 'browserHeight' );

				 // missing required attributes
				if ( !img.orgSrc || !img.browserWidth || !img.browserHeight ) continue;

				img.orgWidth = img.browserWidth;
				img.orgHeight = img.browserHeight;
				img.requestWidth = 0;
				img.requestHeight = 0;
				img.orgClassName = img.className.replace( 'fs-img', 'fs-img-ready' );

				// fill in the image's properties from the element's attributes
				fillImgProperty( img, 'max-width', 'maxWidth', TRUE, maxBrowserWidth );
				fillImgProperty( img, 'max-height', 'maxHeight', TRUE, maxBrowserHeight );

				fillImgProperty( img, 'max-request-width', 'maxRequestWidth', TRUE, maxRequestWidth );
				fillImgProperty( img, 'max-request-height', 'maxRequestHeight', TRUE, maxRequestHeight );

				fillImgProperty( img, 'width-percent', 'widthPercent', TRUE, 0 );
				fillImgProperty( img, 'height-percent', 'heightPercent', TRUE, 0 );

				fillImgProperty( img, 'src-modification', 'srcModification', FALSE, srcModification );
				fillImgProperty( img, 'src-uri-template', 'srcUriTemplate', FALSE, srcUriTemplate );
				fillImgProperty( img, 'pixel-ratio', 'pixelRatio', TRUE, foresight.devicePixelRatio );

				fillImgProperty( img, 'src-high-resolution', 'highResolution', FALSE );

				// add this image to the collection
				foresight.images.push( img );
			}
		}

	},

	fillImgProperty = function ( img, attrName, propName, getFloat, defaultValue ) {
		// standard function to fill up img properties with the <img>'s data attributes
		var value = img.getAttribute( 'data-' + attrName );
		if ( value && value !== '' ) {
			if ( getFloat && !isNaN( value ) ) {
				value = parseFloat( value, 10 );
			}
		} else {
			value = defaultValue;
		}
		img[ propName ] = value;
	},

	initImageRebuild = function () {
		// if we've completed both the connection speed test and finding all the valid foresight 
		// images then rebuild each image's src
		if ( speedConnectionStatus === STATUS_COMPLETE && imageIterateStatus === STATUS_COMPLETE ) {

			if ( foresight.isHighSpeedConn && foresight.devicePixelRatio > 1 ) {
				foresight.hiResEnabled = TRUE;
			}

			var
			x,
			img,
			imgRequestWidth,
			imgRequestHeight,
			requestDimensionChange;

			for ( x = 0; x < foresight.images.length; x++ ) {
				img = foresight.images[ x ];

				// decide if this image should be hi-res
				img.hiResEnabled = ( foresight.isHighSpeedConn && img.pixelRatio > 1 );

				// figure out what this img's parent's dimensions are
				img.parentWidth = getParentClientDimension( img, 'clientWidth' );
				img.parentHeight = getParentClientDimension( img, 'clientHeight' );
					
				// calculate its dimensions if this image's dimensions should be set by percentages
				if ( img.widthPercent ) {
					if ( !img.parentWidth ) continue; // parent not set yet
					var orgW = img.browserWidth; 
					img.browserWidth = round( ( img.widthPercent / 100 ) * img.parentWidth );
					img.browserHeight = round( img.browserHeight * ( img.browserWidth / orgW ) );
				} else if ( img.heightPercent ) {
					if ( !clientHeight ) continue; // parent not set yet
					var orgH = img.browserHeight;
					img.browserHeight = round( ( img.heightPercent / 100 ) * img.parentHeight );
					img.browserWidth = round( img.browserWidth * ( img.browserHeight / orgH ) );
				}

				// ensure the img dimensions do not exceed the max, scale proportionally
				maxDimensionScaling( img, 'browserWidth', 'maxWidth', 'browserHeight', 'maxHeight' );

				if ( !img.browserWidth || !img.browserHeight ) {
					continue; // we're not going to load an image that has no width or height
				}

				// build a list of additional foresight Css Classnames for the <img> which may be useful for designers
				var classNames = ( img.orgClassName ? img.orgClassName.split( ' ' ) : [] );
				classNames.push( ( img.hiResEnabled ? 'fs-high-resolution' : 'fs-standard-resolution' ) );
				classNames.push( 'fs-pixel-ratio-' + img.pixelRatio.toFixed( 1 ).replace('.', '_' ) );
				img.className = classNames.join( ' ' );

				if ( img.hiResEnabled ) {
					// hi-res is good to go, figure out our request dimensions
					imgRequestWidth = round( img.browserWidth * img.pixelRatio );
					imgRequestHeight = round( img.browserHeight * img.pixelRatio );
				} else {
					// no-go on the hi-res, go with the standard size
					imgRequestWidth = img.browserWidth;
					imgRequestHeight = img.browserHeight;
				}

				// only update the request width/height when the new dimension is 
				// larger than the one already loaded
				requestDimensionChange = FALSE;
				if ( imgRequestWidth > img.requestWidth ) {
					img.requestWidth = imgRequestWidth;
					requestDimensionChange = TRUE;
				}
				if ( imgRequestHeight > img.requestHeight ) {
					img.requestHeight = imgRequestHeight;
					requestDimensionChange = TRUE;
				}

				// if the new request size is smaller than the already loaded image 
				// then there's no need to request another
				if ( requestDimensionChange ) {

					// ensure the request dimensions do not exceed the max, scale proportionally
					maxDimensionScaling( img, 'requestWidth', 'maxRequestWidth', 'requestHeight', 'maxRequestHeight' );

					// decide how the src should be modified for the new image request
					if ( img.highResolution && foresight.hiResEnabled ) {
						img.src = img.highResolution;
						img.srcModification = 'hiResSrc';
					} else if ( img.srcModification === 'rebuildSrc' && img.srcUriTemplate ) {
						rebuildSrc( img );
					} else {
						// default: replaceDimensions
						replaceDimensions( img );
					}
				}

				// set the image's actual browser rendering width/height
				img.width = img.browserWidth;
				img.height = img.browserHeight;
			}

			if ( foresight.updateComplete ) {
				foresight.updateComplete();
			}
		}
	},
	
	getParentClientDimension = function ( ele, clientDimension ) {
		// this is reusable to get the element's parent 'clientWidth' and 'clientHeight'
		// inline elements may not have a width/height
		// if the element doesn't have a value for the dimension
		// if not then try that element's parent to get the dimension
		var parentElement = ele.parentElement;
		if ( parentElement ) {
			if ( parentElement[ clientDimension ] ) { // return value if the client dimension is greater than 0
				return parentElement[ clientDimension ];
			} else {
				// keep climbing up until we get a dimension
				return getParentClientDimension( parentElement, clientDimension );
			}
		}
		return 0; // wtf
	},

	maxDimensionScaling = function ( img, widthProp, maxWidthProp, heightProp, maxHeightProp ) {
		// used to ensure both the width and height do not go over the max allowed
		// this function is reusable for both the image's browser width/height, and the request width/height
		// this also ensures that any changes to a dimension will properly scale the image
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

	rebuildSrc = function ( img ) {
		// rebuild the <img> src using the supplied format and image data
		var
		f,
		formatReplace = [ 'protocol', 'host', 'port', 'directory', 'file', 'filename', 'ext', 'query', 'requestWidth', 'requestHeight', 'pixelRatio' ],
		newSrc = img.srcUriTemplate;

		img.uri = parseUri( img.orgSrc );
		img.uri.requestWidth = img.requestWidth;
		img.uri.requestHeight = img.requestHeight;
		img.uri.pixelRatio = img.pixelRatio;

		// loop through all the possible format keys and 
		// replace them with their respective value for this image
		for ( f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img.uri[ formatReplace[ f ] ] );
		}
		img.src = newSrc; // set the new src, begin downloading this image
	},

	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	// Modified by Adam Bradley for foresight.js
	parseUri = function ( str ) {
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

	replaceDimensions = function ( img ) {
		// replace image dimensions already in the src with new dimensions
		// set the new src, begin downloading this image
		img.src = img.orgSrc
					.replace( img.orgWidth, img.requestWidth )
					.replace( img.orgHeight, img.requestHeight );
	},

	initSpeedTest = function () {
		// only check the connection speed once, if there is a status then we've
		// already got info or it already started
		if ( speedConnectionStatus ) return;

		// if the device pixel ratio is 1, then no need to do a network connection 
		// speed test since it can't show hi-res anyways
		if ( foresight.devicePixelRatio === 1 ) {
			foresight.connTestResult = 'skip';
			speedConnectionStatus = STATUS_COMPLETE;
			return;
		}

		// if we know the connection is 2g or 3g, don't even bother with the speed test, cuz its slow
		foresight.connType = ( navigator.connection && navigator.connection.type ? navigator.connection.type.toString().toLowerCase() : 'unknown' );
		if ( foresight.connType !== 'unknown' ) {
			var
			c,
			knownSlowConnections = [ '2g', '3g' ];
			for ( c = 0; c < knownSlowConnections.length; c ++ ) {
				if ( foresight.connType.indexOf( knownSlowConnections[ c ] ) > -1 ) {
					foresight.connTestResult = 'connTypeSlow';
					speedConnectionStatus = STATUS_COMPLETE;
					return;
				}
			}
		}

		// check if a speed test has recently been completed and its 
		// results are saved in the local storage
		try {
			var fsData = JSON.parse( localStorage.getItem( LOCAL_STORAGE_KEY ) );
			if ( fsData !== null ) {
				var minuteDifference = ( ( new Date() ).getTime() - fsData.timestamp ) / 1000 / 60;
				if ( minuteDifference < speedTestExpireMinutes ) {
					// already have connection data within our desired timeframe
					// use this recent data instead of starting another test
					foresight.isHighSpeedConn = fsData.isHighSpeedConn;
					foresight.connKbps = fsData.connKbps;
					foresight.connTestResult = 'localStorage';
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

		speedTestImg.onload = function () {
			// speed test image download completed
			// figure out how long it took and an estimated connection speed
			endTime = ( new Date() ).getTime();

			var duration = round( ( endTime - startTime ) / 1000 );
			duration = ( duration > 1 ? duration : 1 ); // just to ensure we don't divide by 0

			var bitsLoaded = ( speedTestKB * 1024 * 8 );
			foresight.connKbps = ( round( bitsLoaded / duration ) / 1024 );
			foresight.isHighSpeedConn = ( foresight.connKbps >= minKbpsForHighSpeedConn );

			speedTestComplete( 'networkSuccess' );
		};

		speedTestImg.onerror = function () {
			// fallback incase there was an error downloading the speed test image
			speedTestComplete( 'networkError' );
		};

		// begin the network connection speed test image download
		startTime = ( new Date() ).getTime();
		speedConnectionStatus = STATUS_LOADING;
		if ( document.location.protocol === 'https:' ) {
			// if this current document is SSL, make sure this speed test request
			// uses https so there are no ugly security warnings from the browser
			speedTestUri = speedTestUri.replace( 'http:', 'https:' );
		}
		speedTestImg.src = speedTestUri + "?r=" + Math.random();

		// calculate the maximum number of milliseconds it 'should' take to download an XX Kbps file
		// set a timeout so that if the speed test download takes too long
		// than it isn't a high speed connection and ignore what the test image .onload has to say
		// this is used so we don't wait too long on a speed test response 
		// Adding 350ms for TCP slow start, quickAndDirty = true
		speedTestTimeoutMS = ( ( ( speedTestKB * 8 ) / minKbpsForHighSpeedConn ) * 1000 ) + 350;
		setTimeout( function () {
			speedTestComplete( 'networkSlow' );
		}, speedTestTimeoutMS );
	},

	speedTestComplete = function ( connTestResult ) {
		// if we haven't already gotten a speed connection status then save the info
		if (speedConnectionStatus === STATUS_COMPLETE) return;

		// first one with an answer wins
		speedConnectionStatus = STATUS_COMPLETE;
		foresight.connTestResult = connTestResult;

		try {
			var fsDataToSet = {
				connKbps: foresight.connKbps,
				isHighSpeedConn: foresight.isHighSpeedConn,
				timestamp: ( new Date() ).getTime()
			};
			localStorage.setItem( LOCAL_STORAGE_KEY, JSON.stringify( fsDataToSet ) );
		} catch( e ) { }

		initImageRebuild();
	},

	round = function ( value ) {
		// used just for smaller javascript after minify
		return Math.round( value );
	},

	addWindowResizeEvent = function () {
		// attach the foresight.reload event that executes when the window resizes
		if ( window.addEventListener ) {
			window.addEventListener( 'resize', foresight.reload, FALSE );
		} else if ( window.attachEvent ) {
			window.attachEvent( 'onresize', foresight.reload );
		}
	},

	reloadTimeoutId,
	executeReload = function () {
		// execute the reload. This is initially governed by a 'setTimeout'
		// so the reload isn't abused with too many calls
		if ( imageIterateStatus !== STATUS_COMPLETE || speedConnectionStatus !== STATUS_COMPLETE ) return;
		initImages();
		initImageRebuild();
	};

	foresight.reload = function () {
		// if the window resizes or this function is called by external events (like a changepage in jQuery Mobile)
		// then it should reload foresight. Uses a timeout so it can govern how many times the reload executes
		window.clearTimeout( reloadTimeoutId ); 
		reloadTimeoutId = window.setTimeout( executeReload, 100 ); 
	};

	if ( forcedPixelRatio ) {
		// force a certain pixel ratio in the options, used more so for debugging purposes
		foresight.devicePixelRatio = forcedPixelRatio;
	}

	// when the DOM is ready begin finding valid foresight <img>'s and updating their src's
	if ( document.readyState === STATUS_COMPLETE ) {
		initForesight();
	} else {
		if ( document.addEventListener ) {
			document.addEventListener( "DOMContentLoaded", initForesight, FALSE );
			window.addEventListener( "load", initForesight, FALSE );
		} else if ( document.attachEvent ) {
			document.attachEvent( "onreadystatechange", initForesight );
			window.attachEvent( "onload", initForesight );
		}
	};

	// DOM does not need to be ready to begin the network connection speed test
	initSpeedTest();

	// add a listener to the window.resize event
	addWindowResizeEvent();

} ( this.foresight = this.foresight || {}, this, document, navigator ) );