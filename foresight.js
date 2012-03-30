/*
 * Foresight.js 1.1.0 Copyright (c) 2012, Adam Bradley
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
	testConn = opts.testConn || true,
	minKbpsForHighSpeedConn = opts.minKbpsForHighSpeedConn || 400,
	speedTestUri = opts.speedTestUri || 'http://foresightjs.appspot.com/speed-test/50K',
	speedTestKB = opts.speedTestKB || 50,
	speedTestExpireMinutes = opts.speedTestExpireMinutes || 30,
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

				img.orgSrc = img.getAttribute( 'data-src' );  // important, do not set the src attribute yet!

				// get the browser pixel width from the inline css or attributes
				// does not set the .width or .height property yet until the very end
				// always set the img's width/height so we always know its aspect ratio
				img.browserWidth = getImgDimension( img, 'width' );
				img.browserHeight = getImgDimension( img, 'height' );

				 // missing required info
				if ( !img.orgSrc || !img.browserWidth || !img.browserHeight ) continue;

				img.orgWidth = img.browserWidth;
				img.orgHeight = img.browserHeight;
				img.requestWidth = 0;
				img.requestHeight = 0;
				img.highResolutionSrc = img.getAttribute( 'data-high-resolution-src' );
				
				// replace the 'fs-img' class so it removes display:none
				// eventually the 'fs-img' class will be removed from this img
				img.orgClassName = img.className;

				// get the image's CSS properties it's background-image querystring in the CSS, then parse it apart
				// http://refactorer.blogspot.com/2011/08/faking-custom-css-properties.html
				// http://www.quirksmode.org/dom/getstyles.html
				var bi = img.currentStyle ? img.currentStyle.backgroundImage : document.defaultView.getComputedStyle( img, null ).getPropertyValue( 'background-image' );
				
				// split the background-image url and only read its querystring
				var biSplit = bi.split( '?' );
				var urlValue = ( biSplit.length > 1 ? biSplit[ 1 ] : '' );
				
				// parse apart the CSS image-source property value
				var cssParameters = parseCssParameters( unescape( urlValue ) );
		
				// override current properties with any found in the hacked CSS properties
				for ( var x = 0; x < cssParameters.length; x++ ) {
					if ( cssParameters[ x ][ 0 ] === 'template' ) {
						img.srcUriTemplate = cssParameters[ x ][ 1 ];
					} else if ( cssParameters[ x ][ 0 ] === 'max-browser' ) {
						img.maxWidth = cssParameters[ x ][ 1 ][ 0 ];
						img.maxHeight = cssParameters[ x ][ 1 ][ 1 ];
					} else if ( cssParameters[ x ][ 0 ] === 'max-request' ) {
						img.maxRequestWidth = cssParameters[ x ][ 1 ][ 0 ];
						img.maxRequestHeight = cssParameters[ x ][ 1 ][ 1 ];
					} else if ( cssParameters[ x ][ 0 ] === 'fill' ) {
						img.widthPercent = cssParameters[ x ][ 1 ][ 0 ];
						img.heightPercent = cssParameters[ x ][ 1 ][ 1 ];
					}
				}

				// add this image to the collection
				foresight.images.push( img );
			}
		}

	},

	parseCssParameters = function ( imageSourceProperty ) {
		var 
		re = /([a-z-]+)\((?:"([a-z-_0-9{}\\//.:\s]+)"|(\d+)([px%]+) (\d+)([px%]+)|(\d+)% auto|auto (\d+)%)\)/g,
		arr = [], 
		match, 
		value;
		while( match = re.exec( imageSourceProperty ) ) {
			if ( match[ 2 ] ) {
				value = match[ 2 ]; // known string
			} else if ( match[ 3 ] &&  match[ 5 ] ) {
				value = [ parseInt( match[ 3 ], 10 ), parseInt( match[ 5 ], 10 ) ]; // two known numbers
			} else if ( match[ 7 ] ) {
				value = [ parseInt( match[ 7 ], 10 ), null ]; // 1 known number [1, null]
			} else if ( match[ 8 ] ) {
				value = [ null, parseInt( match[ 8 ], 10 ) ]; // 1 known number [null, 1]
			}
			arr.push( [ match[ 1 ], value ] );
		}
		return arr; // [["param1", "stringValue"], ["param2", ["1", "2"]], ["param2", ["34", "555"]]]
	},

	getImgDimension = function ( img, dimension ) {
		// first see if this has an inline CSS dimension, ie: style="width:100px"
		// if not, then check if there is a valid attribute, ie: width="100"
		// returns 0 if it never finds a good value
		var val = getValidInt( img.style[ dimension ] );
		if( val ) {
			img.dimensionValues = 'inlineCss';
			return val;
		}
		img.dimensionValues = 'attributes';
		return getValidInt( img.getAttribute( dimension ) );;
	},

	getValidInt = function ( val ) {
		if ( val && val !== '' ) {
			val = val.replace( 'px', '' );
			if ( !isNaN( val ) ) {
				return parseInt( val, 10 );
			}
		}
		return 0;
	},

	initImageRebuild = function () {
		// if we've completed both the connection speed test and finding all the valid foresight 
		// images then rebuild each image's src
		if ( speedConnectionStatus === STATUS_COMPLETE && imageIterateStatus === STATUS_COMPLETE ) {

			if ( forcedPixelRatio ) {
				// force a certain pixel ratio in the options, used more so for debugging purposes
				foresight.devicePixelRatio = forcedPixelRatio;
				foresight.isHighSpeedConn = TRUE;
			}
			
			if ( foresight.isHighSpeedConn && foresight.devicePixelRatio > 1 ) {
				foresight.hiResEnabled = TRUE;
			}

			var
			x,
			img,
			imgRequestWidth,
			imgRequestHeight,
			requestDimensionIncreased;

			for ( x = 0; x < foresight.images.length; x++ ) {
				img = foresight.images[ x ];
				
				if ( !img.clientWidth ) {
					//continue;
				}
				
				// show the image
				img.style.display = 'inline';
				
				// remember what the img's current clientWidth is before we remove inline dimensions
				var preTestWidth = img.clientWidth;
				
				// remove the inline dimesions and see if the img's size changes
				// TODO: probably pretty poor performance from repainting
				img.style.width = "";
				img.style.height = "";
				
				// get the clientWidth again after removing the inline dimensions
				var postTestWidth = img.clientWidth;
				
				if ( preTestWidth > postTestWidth ) {
					// before the test the image was larger, after the test it got smaller
					// go back to the original dimensions again and stay with the same dimensions
					img.style.width = img.browserWidth + "px";
					img.style.height = img.browserHeight + "px";
				} else {
					// before the test the img was smaller, after the test it got larger
					// image got larger probably because of applying CSS like width:100%
					// remember what these new browser dimensions are
					// scale the browserHeight using the correct aspect ratio
					var orgW = img.browserWidth;
					img.browserWidth = img.clientWidth;
					img.browserHeight = round( img.browserHeight * ( img.browserWidth / orgW ) );
				}

				if ( !img.browserWidth || !img.browserHeight ) {
					// something went wrong
					img.style.display = 'none';
					continue; // we're not going to load an image that has no width or height
				}

				// build a list of additional foresight Css Classnames for the <img> which may be useful
				var classNames = ( img.orgClassName ? img.orgClassName.split( ' ' ) : [] );
				classNames.push( ( foresight.hiResEnabled ? 'fs-high-resolution' : 'fs-standard-resolution' ) );
				classNames.push( 'fs-pixel-ratio-' + foresight.devicePixelRatio.toFixed( 1 ).replace('.', '_' ) );
				img.className = classNames.join( ' ' );

				if ( foresight.hiResEnabled ) {
					// hi-res is good to go, figure out our request dimensions
					imgRequestWidth = round( img.browserWidth * foresight.devicePixelRatio );
					imgRequestHeight = round( img.browserHeight * foresight.devicePixelRatio );
				} else {
					// no-go on the hi-res, go with the default size
					imgRequestWidth = img.browserWidth;
					imgRequestHeight = img.browserHeight;
				}

				// only update the request width/height when the new dimension is 
				// larger than the one already loaded (will always go on first load)
				// if the new request size is smaller than the image already loaded
				// then there's no need to request another img, just let the browser shrink the current img
				if ( imgRequestWidth > img.requestWidth ) {
					img.requestWidth = imgRequestWidth;
					img.requestHeight = imgRequestHeight;

					// decide how the img src should be modified for the image request
					if ( img.highResolutionSrc && foresight.hiResEnabled ) {
						// this image has a hi-res src manually set and the device is hi-res enabled
						// set the img src using the data-high-resolution-src attribute value
						// begin the request for this image
						img.src = img.highResolutionSrc;
						img.srcModification = 'hiResSrc';
					} else if ( img.srcUriTemplate ) {
						// this image's src should be parsed a part then
						// rebuilt using the supplied URI template
						// this allows you to place the dimensions where ever in the src
						rebuildSrc( img );
						img.srcModification = 'uriTemplate';
					} else {
						// default: replaceDimensions
						// this image may already have its default dimensions
						// directly within the src. Replace the default width/height
						// with the new request width/height
						replaceDimensions( img );
						img.srcModification = 'replaceDimensions';
					}
				}

			}

			if ( foresight.updateComplete ) {
				foresight.updateComplete();
			}
		}
	},

	rebuildSrc = function ( img ) {
		// rebuild the <img> src using the supplied format and image data
		var
		f,
		formatReplace = [ 'protocol', 'host', 'port', 'directory', 'file', 'filename', 'ext', 'query', 'requestWidth', 'requestHeight', 'pixelRatio' ],
		newSrc = img.srcUriTemplate;

		// parse apart the original src URI
		img.uri = parseUri( img.orgSrc );
		
		// add in a few more properties we'll need for the find/replace later
		img.uri.requestWidth = img.requestWidth;
		img.uri.requestHeight = img.requestHeight;
		img.uri.pixelRatio = foresight.devicePixelRatio;

		// loop through all the possible format keys and 
		// replace them with their respective value for this image
		for ( f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img.uri[ formatReplace[ f ] ] );
		}
		img.src = newSrc; // set the new src, begin the request for this image
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
		// set the new src, begin the request for this image
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