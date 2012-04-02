/*
 * Foresight.js 2.0.0 Copyright (c) 2012, Adam Bradley
 * Available via the MIT license.
 * For details see: https://github.com/adamdbradley/foresight.js
 */

; ( function ( foresight, window, document, navigator ) {
	"use strict";

	// properties
	foresight.devicePixelRatio = ( ( window.devicePixelRatio && window.devicePixelRatio > 1 ) ? window.devicePixelRatio : 1 );
	foresight.bandwidth = 'low';
	foresight.connKbps;
	foresight.connTestResult;
	foresight.connType;
	foresight.images = [];

	// options
	foresight.options = foresight.options || {};
	var opts = foresight.options,
	testConn = opts.testConn || true,
	minKbpsForHighBandwidth = opts.minKbpsForHighBandwidth || 400,
	speedTestUri = opts.speedTestUri || 'http://foresightjs.appspot.com/speed-test/50K',
	speedTestKB = opts.speedTestKB || 50,
	speedTestExpireMinutes = opts.speedTestExpireMinutes || 30,

	// used to keep track of the progress status for finding foresight 
	// images in the DOM and connection test results
	imageIterateStatus,
	speedConnectionStatus,

	// for minification purposes
	STATUS_LOADING = 'loading',
	STATUS_COMPLETE = 'complete',
	LOCAL_STORAGE_KEY = 'fsjs',
	BROWSER_WIDTH = 'browserWidth',
	BROWSER_HEIGHT = 'browserHeight',
	REQUEST_WIDTH = 'requestWidth',
	REQUEST_HEIGHT = 'requestHeight',
	DIMENSION_WIDTH = 'width',
	DIMENSION_HEIGHT = 'height',
	TRUE = true,
	FALSE = false,

	initForesight = function () {
		// begin finding valid foresight <img>'s and updating their src's
		if ( imageIterateStatus ) return;

		imageIterateStatus = STATUS_LOADING;

		if ( opts.forcedPixelRatio ) {
			// force a certain device pixel ratio, used more so for debugging purposes
			foresight.devicePixelRatio = opts.forcedPixelRatio;
		}
		
		if ( opts.forcedBandwidth ) {
			// force that this device has a high speed connection, used more so for debugging purposes
			foresight.bandwidth = opts.forcedBandwidth;
		}
		
		initImages();
		imageIterateStatus = STATUS_COMPLETE;

		initImageRebuild();
	},

	initImages = function () {
		// loop through each of the document.images and find valid foresight images
		var
		x,
		img,
		customCss,
		cssRegex = /url\((?:([a-zA-Z-_0-9{}\\//.:\s]+))\)/g, // regex used to parse apart custom CSS
		imageSetCssValue,
		imageSetValues,
		imageSetItem,
		y,
		urlMatch;

		for ( x = 0; x < document.images.length; x ++ ) {
			img = document.images[ x ];

			// initialize some properties the image will use
			if ( !img.initalized ) {
				// only gather the images that haven't already been initialized
				img.initalized = TRUE;

				img.orgSrc = getDataAttribute( img, 'src' );  // important, do not set the src attribute yet!

				// always set the img's data-width & data-height attributes so we always know its aspect ratio
				img.widthUnits = getDataAttribute( img, DIMENSION_WIDTH, true );
				img.heightUnits = getDataAttribute( img, DIMENSION_HEIGHT, true );

				 // missing required info
				if ( !img.orgSrc || !img.widthUnits || !img.heightUnits ) continue;

				img[ REQUEST_WIDTH ] = 0;
				img[ REQUEST_HEIGHT ] = 0;
				img.highResolutionSrc = getDataAttribute( img, 'high-resolution-src' );
				img.orgClassName = ( img.className ? img.className : '' );

				// font-family will be the hacked CSS property which contains the image-set() CSS value
				// image-set(url(foo-lowres.png) 1x low-bandwidth, url(foo-highres.png) 2x high-bandwidth);
				// http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html
				// http://trac.webkit.org/changeset/111637
				imageSetCssValue = getComputedStyleValue( img, 'font-family', 'fontFamily' ).split( 'image-set(' );

				img.imageSet = [];

				if ( imageSetCssValue.length > 1) {
					// parse apart the custom CSS image-source property value

					imageSetValues = imageSetCssValue[1].split( ',' );

					for ( y = 0; y < imageSetValues.length; y ++ ) {

						// set the defaults for this image-set item
						imageSetItem = { 
							uriTemplate: null,
							scaleFactor: null,
							bandwidth: null,
							text: imageSetValues[ y ]
						};

						// get the image's scale factor if it was provided (default is 1)
						if ( imageSetItem.text.indexOf( ' 2x' ) > -1 ) {
							imageSetItem.scaleFactor = 2;
						} else if ( imageSetItem.text.indexOf( ' 1.5x' ) > -1 ) {
							imageSetItem.scaleFactor = 1.5;
						} else {
							imageSetItem.scaleFactor = foresight.devicePixelRatio;
						}

						// get the image's bandwidth value if it was provided (default is low)
						if ( imageSetItem.text.indexOf( 'high-bandwidth' ) > -1 ) {
							imageSetItem.bandwidth = 'high';
						} else {
							imageSetItem.bandwidth = foresight.bandwidth;
						}

						// get the url's value (the URI template)
						while ( urlMatch = cssRegex.exec( imageSetItem.text ) ) {
							if ( urlMatch[ 1 ] != null ) {
								imageSetItem.uriTemplate = urlMatch[ 1 ];
							}
						}

						img.imageSet.push( imageSetItem );
					}
				}

				// handle any response errors which may happen with this image
				img.onerror = imgResponseError;
				
				// add this image to the collection
				foresight.images.push( img );
			}
		}
	},

	getDataAttribute = function ( img, attribute, getInt ) {
		var value = img.getAttribute( 'data-' + attribute );
		if ( getInt ) {
			return parseValidInt( value );
		}
		return value;
	},

	getComputedStyleValue = function ( element, cssProperty, jsReference ) {
		// get the computed style value for this element (but there's an IE way and the rest-of-the-world way)
		return element.currentStyle ? element.currentStyle[ jsReference ] : document.defaultView.getComputedStyle( element, null ).getPropertyValue( cssProperty );
	},
	
	getComputedPixelWidth = function ( element, pixelWidth, style, runtimeStyle, maxWidth ) {
		pixelWidth = getComputedStyleValue( element, DIMENSION_WIDTH, DIMENSION_WIDTH );
		if ( pixelWidth.indexOf( '%' ) === -1 ) return pixelWidth;
		
		// didn't get a computed pixel width, probably our friend IE, do this trick
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
		style = element.style.left;
		runtimeStyle = element.runtimeStyle.left;
		element.runtimeStyle.left = element.currentStyle.left;
		element.style.left = pixelWidth || 0;
		pixelWidth = element.style.pixelLeft;
		element.style.left = style;
		element.runtimeStyle.left = runtimeStyle;
		
		maxWidth = parseValidInt( getComputedStyleValue( element, 'max-width', 'maxWidth' ).replace( 'px', '' ) );
		return (pixelWidth < maxWidth ? pixelWidth : maxWidth) + 'px';
	},
	
	parseValidInt = function ( value ) {
		if ( !isNaN( value ) ) {
			return parseInt( value, 10 );
		}
		return 0;
	},
	
	initImageRebuild = function () {
		// if we've completed both the connection speed test and finding all
		// of the valid foresight images then rebuild each image's src
		if ( !( speedConnectionStatus === STATUS_COMPLETE && imageIterateStatus === STATUS_COMPLETE ) ) return;

		var
		x,
		imagesLength = foresight.images.length,
		img,
		imgrequestWidth,
		imgrequestHeight,
		dimensionIncreased,
		classNames,
		hiResClassName,
		dimensionClassName,
		dimensionCssRules = [],
		computedWidthValue,
		y,
		imageSetItem;

		for ( x = 0; x < imagesLength; x++ ) {
			img = foresight.images[ x ];
			
			if ( !isParentVisible( img ) ) {
				// parent element not visible (yet anyways) so don't continue with this img
				continue;
			}
			
			// build a list of CSS Classnames for the <img> which may be useful
			classNames = img.orgClassName.split( ' ' );
			
			// get the computed pixel width according to the browser
			computedWidthValue = getComputedStyleValue( img, DIMENSION_WIDTH, DIMENSION_WIDTH );
			if ( computedWidthValue.indexOf( '%' ) > 0 ) {
				// if the width has a percent value then change the display to
				// display:block to help get correct browser pixel width
				
				if ( !img.unitType ) {
					img.style.display = 'block';
					img.unitType = 'percent';
					computedWidthValue = getComputedPixelWidth( img, DIMENSION_WIDTH, DIMENSION_WIDTH );
					img.computedWidth = parseValidInt( computedWidthValue.replace( 'px' , '' ) );
					// show the display as inline so it flows in the webpage like a normal img
					img.style.display = 'inline';
				}
				
				// the computed width is probably getting controlled by some applied width property CSS
				// since we now know what the pixel width the browser wants it to be, calculate its height
				// the height should be calculated with the correct aspect ratio
				img[ BROWSER_WIDTH ] = img.computedWidth;
				img[ BROWSER_HEIGHT ] = Math.round( img.heightUnits * ( img.computedWidth / img.widthUnits ) );
				
			} else if ( !img.unitType ) {
				// there is no computed width, so it must not have any width CSS applied
				// assign the browser pixels to equal the width and height Units
				
				img.unitType = 'pixel';
				img[ BROWSER_WIDTH ] = img.widthUnits;
				img[ BROWSER_HEIGHT ] = img.heightUnits;
				// show the display to inline so it flows in the webpage like a normal img
				img.style.display = 'inline';
				
				// instead of manually assigning width, then height, for every image and doing many repaints
				// create a clasname with its dimensions and when we're all done
				// we can then add those CSS dimension classnames to the document and do less repaints
				dimensionClassName = 'fs-' + img[ BROWSER_WIDTH ] + 'x' + img[ BROWSER_HEIGHT ];
				classNames.push( dimensionClassName );
				
				// build a list of CSS rules for all the different dimensions (sorry, ugly i know)
				// ie:  .fs-640x480{width:640px;height:480px}
				dimensionCssRules.push( '.' + dimensionClassName + '{width:' + img[ BROWSER_WIDTH ] + 'px;height:' + img[ BROWSER_HEIGHT ] + 'px}' );
				
			}

			// set the defaults this image will use
			img.uriTemplate = null;
			img.scaleFactor = foresight.devicePixelRatio;
			img.bandwidth = foresight.bandwidth;

			// image-set( url(foo-lowres.png) 1x low-bandwidth, url(foo-highres.png) 2x high-bandwidth );
			// use the scale factor and bandwidth value to determine which URI template to apply to the img src
			// loop through each of the items in the imageSet and pick out which one to use
			for ( y = 0; y < img.imageSet.length; y++ ) {
				imageSetItem = img.imageSet[ y ];
				if ( foresight.bandwidth === imageSetItem.bandwidth && foresight.devicePixelRatio === imageSetItem.scaleFactor ) {
					img.uriTemplate = imageSetItem.uriTemplate;
					img.scaleFactor = imageSetItem.scaleFactor;
					img.bandwidth = imageSetItem.bandwidth;
				} else if ( foresight.devicePixelRatio === imageSetItem.scaleFactor ) {
					img.uriTemplate = imageSetItem.uriTemplate;
					img.scaleFactor = imageSetItem.scaleFactor;
				} else if ( foresight.bandwidth === imageSetItem.bandwidth ) {
					img.uriTemplate = imageSetItem.uriTemplate;
					img.bandwidth = imageSetItem.bandwidth;
				}
			}
			
			// decide if this image should be hi-res or not
			if ( img.bandwidth === 'high' && img.scaleFactor > 1 ) {
				// hi-res is good to go, figure out our request dimensions
				imgrequestWidth = Math.round( img[ BROWSER_WIDTH ] * img.scaleFactor );
				imgrequestHeight = Math.round( img[ BROWSER_HEIGHT ] * img.scaleFactor );
				foresight.hiResEnabled = TRUE;
				classNames.push( 'fs-high-resolution' );
			} else {
				// no-go on the hi-res, go with the default size
				imgrequestWidth = img[ BROWSER_WIDTH ];
				imgrequestHeight = img[ BROWSER_HEIGHT ];
				foresight.hiResEnabled = FALSE;
				classNames.push( 'fs-standard-resolution' );
			}

			// only update the request width/height when the new dimension is 
			// larger than the one already loaded (will always be needed on first load)
			// if the new request size is smaller than the image already loaded then there's 
			// no need to request another img, just let the browser shrink the current img
			if ( imgrequestWidth > img[ REQUEST_WIDTH ] ) {
				img[ REQUEST_WIDTH ] = imgrequestWidth;
				img[ REQUEST_HEIGHT ] = imgrequestHeight;

				// decide how the img src should be modified for the image request
				if ( img.highResolutionSrc && foresight.hiResEnabled ) {
					// this image has a hi-res src manually set and the device is hi-res enabled
					// set the img src using the data-high-resolution-src attribute value
					// begin the request for this image
					if ( img.highResolutionSrc !== img.src ){ 
						img.src = img.highResolutionSrc;
					}
					img.srcModification = 'src-hi-res';
				} else if ( img.uriTemplate ) {
					// this image's src should be parsed a part then
					// rebuilt using the supplied URI template
					// this allows you to place the dimensions where ever in the src
					rebuildSrcFromUriTemplate( img );
					img.srcModification = 'src-uri-template';
				} else {
					// default: replaceDimensions
					// this image may already have its default dimensions
					// directly within the src. Replace the default width/height
					// with the new request width/height
					replaceDimensions( img );
					img.srcModification = 'src-replace-dimensions';
				}
			}
			
			classNames.push( 'fs-' + img.srcModification );
			
			// assign the new CSS classnames to the img
			img.className = classNames.join( ' ' );

		}
		
		// if there were are imgs that need width/height assigned to them then
		// add their CSS rules to the document
		if ( dimensionCssRules.length ) {
			applyDimensionCssRules( dimensionCssRules );
		}
		
		if ( foresight.updateComplete ) {
			foresight.updateComplete();
		}

		// remember what the width is to evaluate later when the window resizes
		lastWindowWidth = window.innerWidth;
	},

	isParentVisible = function ( ele, parent, displayValue ) {
		parent = ele.parentElement;
		if ( parent.clientWidth ) {
			return TRUE;
		}
		displayValue = getComputedStyleValue( parent, 'display', 'display' );
		if ( displayValue === 'inline' ) {
			return isParentVisible( parent );
		}
		return FALSE;
	},

	dimensionStyleEle,
	applyDimensionCssRules = function ( dimensionCssRules ) {
		if ( !dimensionStyleEle ) {
			// build a new style element to hold all the dimension CSS rules
			// add the new style element to the head element
			dimensionStyleEle = document.createElement( 'style' );
			dimensionStyleEle.setAttribute( 'type', 'text/css' );
		}
		
		var cssRules = dimensionCssRules.join( '' );
		
		// add all of the dimension CSS rules to the style element
		try {
			dimensionStyleEle.innerText = cssRules;
		} catch( e ) {
			// our trusty friend IE has their own way of doing things, weird I know
			dimensionStyleEle.styleSheet.cssText = cssRules;
		}
		
		if ( dimensionStyleEle.parentElement == null ) {
			// append it to the head element if we haven't done so yet
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( dimensionStyleEle );
		}
	},

	rebuildSrcFromUriTemplate = function ( img ) {
		// rebuild the <img> src using the supplied URI template and image data
		var
		f,
		formatReplace = [ 'src', 'protocol', 'host', 'port', 'directory', 'file', 'filename', 'ext', 'query', 'requestWidth', 'requestHeight', 'scaleFactor' ],
		newSrc = img.uriTemplate;

		// parse apart the original src URI
		img.uri = parseUri( img.orgSrc );

		// add in a few more properties we'll need for the find/replace later
		img.uri.src = img.orgSrc;
		img.uri[ REQUEST_WIDTH ] = img[ REQUEST_WIDTH ];
		img.uri[ REQUEST_HEIGHT ] = img[ REQUEST_HEIGHT ];
		img.uri.scaleFactor = img.scaleFactor;

		// loop through all the possible format keys and 
		// replace them with their respective value for this image
		for ( f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img.uri[ formatReplace[ f ] ] );
		}
		if ( newSrc !== img.src ) {
			img.src = newSrc; // set the new src, begin the request for this image
		}
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
		// do this flip-flop replace so dimensions do step on one another after replacing
		// set the new src, begin the request for this image
		var newSrc = img.orgSrc
						.replace( img.widthUnits, '{requestWidth}' )
						.replace( img.heightUnits, '{requestHeight}' );
		newSrc = newSrc
					.replace( '{requestWidth}', img[ REQUEST_WIDTH ] )
					.replace( '{requestHeight}', img[ REQUEST_HEIGHT ] );
					
		if ( img.src !== newSrc ) {
			img.src = newSrc;
		}
	},

	imgResponseError = function ( e ) {
		if ( !e || !e.target || e.target.hadError ) return;
		
		// very first error
		e.target.hadError = TRUE;
		e.target.src = img.orgSrc;
		e.target.srcModification = 'response-error';
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
				if ( ( new Date() ).getTime() < fsData.expires ) {
					// already have connection data within our desired timeframe
					// use this recent data instead of starting another test
					foresight.bandwidth = fsData.bandwidth;
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

			var duration = ( endTime - startTime ) / 1000;
			duration = ( duration > 1 ? duration : 1 ); // just to ensure we don't divide by 0

			var bitsLoaded = ( speedTestKB * 1024 * 8 );
			foresight.connKbps = ( bitsLoaded / duration ) / 1024;
			foresight.bandwidth = ( foresight.connKbps >= minKbpsForHighBandwidth ? 'high' : 'low' );

			speedTestComplete( 'networkSuccess' );
		};

		speedTestImg.onerror = function () {
			// fallback incase there was an error downloading the speed test image
			speedTestComplete( 'networkError', 5 );
		};

		speedTestImg.onabort = function () {
			// fallback incase there was an abort during the speed test image
			speedTestComplete( 'networkAbort', 5 );
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
		// Adding 350ms to account for TCP slow start, quickAndDirty = true
		speedTestTimeoutMS = ( ( ( speedTestKB * 8 ) / minKbpsForHighBandwidth ) * 1000 ) + 350;
		setTimeout( function () {
			speedTestComplete( 'networkSlow' );
		}, speedTestTimeoutMS );
	},

	speedTestComplete = function ( connTestResult, expireMinutes ) {
		// if we haven't already gotten a speed connection status then save the info
		if (speedConnectionStatus === STATUS_COMPLETE) return;

		// first one with an answer wins
		speedConnectionStatus = STATUS_COMPLETE;
		foresight.connTestResult = connTestResult;

		try {
			if ( !expireMinutes ) {
				expireMinutes = speedTestExpireMinutes;
			}
			var fsDataToSet = {
				connKbps: foresight.connKbps,
				bandwidth: foresight.bandwidth,
				expires: ( new Date() ).getTime() + (expireMinutes / 60 / 1000)
			};
			localStorage.setItem( LOCAL_STORAGE_KEY, JSON.stringify( fsDataToSet ) );
		} catch( e ) { }

		initImageRebuild();
	},

	addWindowResizeEvent = function () {
		// attach the foresight.reload event that executes when the window resizes
		if ( window.addEventListener ) {
			window.addEventListener( 'resize', windowResized, FALSE );
		} else if ( window.attachEvent ) {
			window.attachEvent( 'onresize', windowResized );
		}
	},
	
	lastWindowWidth = 0,
	windowResized = function () {
		// only reload when the window changes the width
		// we don't care if the window's height changed
		if ( lastWindowWidth !== window.innerWidth ) {
			foresight.reload();
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
		reloadTimeoutId = window.setTimeout( executeReload, 400 ); 
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
	}

	// DOM does not need to be ready to begin the network connection speed test
	initSpeedTest();

	// add a listener to the window.resize event
	addWindowResizeEvent();

} ( this.foresight = this.foresight || {}, this, document, navigator ) );