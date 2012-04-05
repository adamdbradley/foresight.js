/*
 * Foresight.js 2.0.0 Copyright (c) 2012, Adam Bradley
 * Available via the MIT license.
 * For details see: https://github.com/adamdbradley/foresight.js
 */

; ( function ( foresight, window, document, navigator ) {
	"use strict";

	foresight.images = []; 
	foresight.options = foresight.options || {};

	// options
	var opts = foresight.options,
	testConn = opts.testConn || true,
	minKbpsForHighBandwidth = opts.minKbpsForHighBandwidth || 400,
	speedTestUri = opts.speedTestUri || 'http://foresightjs.appspot.com/speed-test/50K',
	speedTestKB = opts.speedTestKB || 50,
	speedTestExpireMinutes = opts.speedTestExpireMinutes || 30,
	knownSlowConnections = opts.knownSlowConnections || [ '2g', '3g' ],
	hiResClassname =  opts.hiResClassname || 'fs-high-resolution',
	lowResClassname = opts.lowResClassname || 'fs-standard-resolution',

	// using property string references for minification purposes
	DEVICE_PIXEL_RATIO = 'devicePixelRatio',
	DEVICE_PIXEL_RATIO_ROUNDED = 'devicePixelRatioRounded',
	BANDWIDTH = 'bandwidth',
	CONNECTION_TYPE = 'connType',
	CONNECTION_TEST_RESULT = 'connTestResult',
	CONNECTION_KBPS = 'connKbps',
	REQUEST_CHANGE = 'requestChange',
	HIGH_RES_SRC = 'highResolutionSrc',
	BROWSER_WIDTH = 'browserWidth',
	BROWSER_HEIGHT = 'browserHeight',
	REQUEST_WIDTH = 'requestWidth',
	REQUEST_HEIGHT = 'requestHeight',
	DIMENSION_WIDTH = 'width',
	DIMENSION_HEIGHT = 'height',
	WIDTH_UNITS = 'widthUnits',
	HEIGHT_UNITS = 'heightUnits',
	SCALE = 'scale',
	SCALE_ROUNDED = 'scaleRounded',
	URI_TEMPLATE = 'uriTemplate',
	URI_FIND = 'uriFind',
	URI_REPLACE = 'uriReplace',
	SRC_MODIFICATION = 'srcModification',
	STATUS_LOADING = 'loading',
	STATUS_COMPLETE = 'complete',
	LOCAL_STORAGE_KEY = 'fsjs',
	TRUE = true,
	FALSE = false,
	imageSetItemRegex = /url\((?:([a-zA-Z-_0-9{}\\/.:\s]+)|([a-zA-Z-_0-9{}\\/.:\s]+)\|([a-zA-Z-_0-9{}\\/.:\s]+))\)/g,

	// used to keep track of the progress status for finding foresight 
	// images in the DOM and connection test results
	imageIterateStatus,
	speedConnectionStatus,

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
		img,
		customCss,
		imageSetText;

		for ( x = 0; x < document.images.length; x ++ ) {
			img = document.images[ x ];

			// initialize properties the image will use
			// only gather the images that haven't already been initialized
			if ( img.initalized ) continue;

			img.initalized = TRUE;

			img.orgSrc = getDataAttribute( img, 'src' );  // important, do not set the src attribute yet!

			// always set the img's data-width & data-height attributes so we always know its aspect ratio
			img[ WIDTH_UNITS ] = getDataAttribute( img, DIMENSION_WIDTH, TRUE );
			img[ HEIGHT_UNITS ] = getDataAttribute( img, DIMENSION_HEIGHT, TRUE );

			 // missing required info
			if ( !img.orgSrc || !img[ WIDTH_UNITS ] || !img[ HEIGHT_UNITS ] ) continue;

			img[ REQUEST_WIDTH ] = 0;
			img[ REQUEST_HEIGHT ] = 0;
			img[ HIGH_RES_SRC ] = getDataAttribute( img, 'high-resolution-src' );
			img.orgClassName = ( img.className ? img.className : '' );

			// font-family will be the hacked CSS property which contains the image-set() CSS value
			// image-set(url(foo-lowres.png) 1x low-bandwidth, url(foo-highres.png) 2x high-bandwidth);
			// http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html
			// http://trac.webkit.org/changeset/111637
			imageSetText = getComputedStyleValue( img, 'font-family', 'fontFamily' ).split( 'image-set(' );

			img.imageSet = [];
			
			img.imageSet.push( { 
				uriTemplate: null,
				uriFind: null,
				uriReplace: null,
				scale: foresight[ DEVICE_PIXEL_RATIO ],
				bandwidth: foresight[ BANDWIDTH ],
				text: null
			} );

			if ( imageSetText.length > 1 ) {
				// parse apart the custom CSS image-set() text
				parseImageSet( img, imageSetText[ 1 ] );
			}

			// handle any response errors which may happen with this image
			img.onerror = imgResponseError;

			// add this image to the collection
			foresight.images.push( img );
		}
	},

	parseImageSet = function ( img, imageSetText ) {
		// parse apart the custom CSS image-set() text
		// add each image-set item to the img.imageSet array
		// the array will be used later when deciding what image to request
		var
		y,
		imageSetValues = imageSetText.split( ',' ),
		imageSetItem,
		urlMatch;

		for ( y = 0; y < imageSetValues.length; y ++ ) {

			// set the defaults for this image-set item
			// scaleFactor and bandwidth initially are set to the device's info
			imageSetItem = { 
				uriTemplate: null,
				uriFind: null,
				uriReplace: null,
				scale: null,
				bandwidth: null,
				text: imageSetValues[ y ]
			};

			// get the image's scale factor if it was provided
			if ( imageSetItem.text.indexOf( ' 2x' ) > -1 ) {
				imageSetItem[ SCALE ] = 2;
			} else if ( imageSetItem.text.indexOf( ' 1.5x' ) > -1 ) {
				imageSetItem[ SCALE ] = 1.5;
			} else if ( imageSetItem.text.indexOf( ' 1x' ) > -1 ) {
				imageSetItem[ SCALE ] = 1;
			}

			// get the image's bandwidth value if it was provided
			if ( imageSetItem.text.indexOf( 'high-bandwidth' ) > -1 ) {
				imageSetItem[ BANDWIDTH ] = 'high';
			} else if ( imageSetItem.text.indexOf( 'low-bandwidth' ) > -1 ) {
				imageSetItem[ BANDWIDTH ] = 'low';
			}

			// get the values pulled out of the image-set with a regex
			while ( urlMatch = imageSetItemRegex.exec( imageSetItem.text ) ) {
				if ( urlMatch[ 1 ] != null ) {
					// url(URI_TEMPLATE)
					imageSetItem[ URI_TEMPLATE ] = urlMatch[ 1 ];
				} else if ( urlMatch[ 2 ] != null && urlMatch[ 3 ] != null ) {
					// url-replace(URI_FIND|URI_REPLACE)
					imageSetItem[ URI_FIND ] = urlMatch[ 2 ];
					imageSetItem[ URI_REPLACE ] = urlMatch[ 3 ];
				}
			}

			// each img keeps an array containing each of its image-set items
			// this array is used later when foresight decides which image to request
			img.imageSet.push( imageSetItem );
		}
	},

	getDataAttribute = function ( img, attribute, getInt, value ) {
		// get an <img> element's data- attribute value
		value = img.getAttribute( 'data-' + attribute );
		if ( getInt ) {
			if ( !isNaN( value ) ) {
				return parseInt( value, 10 );
			}
			return 0;
		}
		return value;
	},

	initImageRebuild = function () {
		// if we've completed both the connection speed test and we've found
		// all of the valid foresight images then rebuild each image's src
		if ( !( speedConnectionStatus === STATUS_COMPLETE && imageIterateStatus === STATUS_COMPLETE ) ) return;

		// variables reused throughout the for loop
		var
		x,
		y,
		imagesLength = foresight.images.length,
		img,
		imgRequestWidth,
		imgRequestHeight,
		dimensionIncreased,
		classNames,
		dimensionClassName,
		dimensionCssRules = [],
		computedWidthValue,
		imageSetItem;

		for ( x = 0; x < imagesLength; x++ ) {
			img = foresight.images[ x ];

			if ( !isParentVisible( img ) ) {
				// parent element is not visible (yet anyways) so don't continue with this img
				continue;
			}

			// build a list of CSS Classnames for the <img> which may be useful
			classNames = img.orgClassName.split( ' ' );

			// get the computed pixel width according to the browser
			fillComputedPixelDimensions( img );
			if ( img.unitType == 'pixel' ) {
				// instead of manually assigning width, then height, for every image and doing many repaints
				// create a classname from its dimensions and when we're all done
				// we can then add those CSS dimension classnames to the document and do less repaints
				dimensionClassName = 'fs-' + img[ BROWSER_WIDTH ] + 'x' + img[ BROWSER_HEIGHT ];
				classNames.push( dimensionClassName );

				// build a list of CSS rules for all the different dimensions
				// ie:  .fs-640x480{width:640px;height:480px}
				dimensionCssRules.push( '.' + dimensionClassName + '{width:' + img[ BROWSER_WIDTH ] + 'px;height:' + img[ BROWSER_HEIGHT ] + 'px}' );
			}

			// show the display to inline so it flows in the webpage like a normal img
			if ( img.style.display !== 'inline' ) {
				img.style.display = 'inline';
			}

			// image-set( url(foo-lowres.png) 1x low-bandwidth, url(foo-highres.png) 2x high-bandwidth );
			// use the scale factor and bandwidth value to determine which image-set item to apply to the img src
			// loop through each of the items in the imageSet and pick out which one to use
			for ( y = 0; y < img.imageSet.length; y++ ) {
				imageSetItem = img.imageSet[ y ];
				if ( foresight[ BANDWIDTH ] === imageSetItem[ BANDWIDTH ] && foresight[ DEVICE_PIXEL_RATIO ] === imageSetItem[ SCALE ] ) {
					// this device has the exact bandwidth and device pixel ratio required
					setImageFromImageSet( img, imageSetItem );
				} else if ( foresight[ BANDWIDTH ] === imageSetItem[ BANDWIDTH ] && foresight[ DEVICE_PIXEL_RATIO_ROUNDED ] === Math.round( imageSetItem[ SCALE ] ) ) {
					// this device has the exact bandwidth and device pixel ratio required
					setImageFromImageSet( img, imageSetItem );
				} else if ( foresight[ DEVICE_PIXEL_RATIO ] === imageSetItem[ SCALE ] ) {
					// this device has the correct device pixel ratio required
					setImageFromImageSet( img, imageSetItem );
				} else if ( foresight[ BANDWIDTH ] === imageSetItem[ BANDWIDTH ] ) {
					// this device has the correct bandwidth required
					setImageFromImageSet( img, imageSetItem );
				}
			}
			img[ SCALE_ROUNDED ] = Math.round( img[ SCALE ] );

			// decide if this image should be hi-res or not
			// both the bandwidth should be 'high' and the scale factor greater than 1
			if ( img[ BANDWIDTH ] === 'high' && img[ SCALE ] > 1 ) {
				// hi-res is good to go, figure out our request dimensions
				imgRequestWidth = Math.ceil( img[ BROWSER_WIDTH ] * img[ SCALE ] );
				imgRequestHeight = Math.ceil( img[ BROWSER_HEIGHT ] * img[ SCALE ] );
				foresight.hiResEnabled = TRUE;
			} else {
				// no-go on the hi-res, go with the default size
				imgRequestWidth = img[ BROWSER_WIDTH ];
				imgRequestHeight = img[ BROWSER_HEIGHT ];
				foresight.hiResEnabled = FALSE;
			}

			// only update the request width/height when the new dimension is 
			// larger than the one already loaded (this will always be needed on first load)
			// if the new request size is smaller than the image already loaded then there's 
			// no need to request another image, just let the browser shrink the current img
			if ( imgRequestWidth > img[ REQUEST_WIDTH ] ) {
				img[ REQUEST_WIDTH ] = imgRequestWidth;
				img[ REQUEST_HEIGHT ] = imgRequestHeight;

				// decide how the img src should be modified for the image request
				if ( img[ HIGH_RES_SRC ] && foresight.hiResEnabled ) {
					// this image has a hi-res src manually set and the device is hi-res enabled
					// set the img src using the data-high-resolution-src attribute value
					// begin the request for this image
					img.src = img[ HIGH_RES_SRC ];
					img[ SRC_MODIFICATION ] = 'src-hi-res';
				} else if ( img[ URI_TEMPLATE ] ) {
					// this image's src should be parsed a part then
					// rebuilt using the supplied URI template
					// this allows you to place the dimensions where ever in the src
					rebuildSrcFromUriTemplate( img );
					img[ SRC_MODIFICATION ] = 'src-uri-template';
				} else if ( img[ URI_FIND ] && img[ URI_REPLACE ] ) {
					// this should find a certain values in the image's src 
					// then replace the values with values given
					replaceUriValues( img );
					img[ SRC_MODIFICATION ] = 'src-replace-dimensions';
				} else {
					// make no changes from the original src
					img.src = img.orgSrc;
					img[ SRC_MODIFICATION ] = 'src-original';
				}
				img[ REQUEST_CHANGE ] = TRUE;
			} else {
				img[ REQUEST_CHANGE ] = FALSE;
			}

			// add a CSS classname if this img is hi-res or not
			if ( foresight.hiResEnabled && img.src !== img.orgSrc ) {
				classNames.push( hiResClassname );
			} else {
				classNames.push( lowResClassname );
			}
			classNames.push( 'fs-' + img[ SRC_MODIFICATION ] );

			// assign the new CSS classnames to the img
			img.className = classNames.join( ' ' );

		}

		// if there were are imgs that need width/height assigned to them then
		// add their CSS rules to the document
		if ( dimensionCssRules.length ) {
			applyDimensionCssRules( dimensionCssRules );
		}
		
		if ( foresight.updateComplete ) {
			// fire off the updateComplete() function if one exists
			foresight.updateComplete();
		}

		// remember what the window width is to evaluate later when the window resizes
		lastWindowWidth = getWindowWidth();
	},

	setImageFromImageSet = function ( img, imageSet ) {
		// used as a common function to copy over imageSetItem values to the image
		var
		x,
		propertyArr = [ URI_TEMPLATE, URI_FIND, URI_REPLACE, SCALE, BANDWIDTH ];
		for ( x = 0; x < propertyArr.length; x++ ) {
			img[ propertyArr[ x ] ] = imageSet[ propertyArr[ x ] ];
		}
	},

	isParentVisible = function ( ele, parent ) {
		// test to see if this element's parent is currently visible in the DOM
		parent = ele.parentElement;
		if ( parent.clientWidth ) {
			return TRUE;
		}
		if ( getComputedStyleValue( parent, 'display' ) === 'inline' ) {
			// if its an inline element then we won't get a good clientWidth
			// so try again with this element's parent
			return isParentVisible( parent );
		}
		return FALSE;
	},

	fillComputedPixelDimensions = function ( img, computedWidthValue ) {
		// get the computed pixel width according to the browser
		// this is most important for images set by percents
		// and images with a max-width set
		if ( !img.unitType ) {
			computedWidthValue = getComputedStyleValue( img, DIMENSION_WIDTH );
			if ( computedWidthValue.indexOf( '%' ) > 0 ) {
				// if the width has a percent value then change the display to
				// display:block to help get correct browser pixel width
				img.unitType = 'percent';
			} else {
				// the browser already knows the exact pixel width
				// assign the browser pixels to equal the width and height units
				// this only needs to happen the first time
				img.unitType = 'pixel';
				img[ BROWSER_WIDTH ] = img[ WIDTH_UNITS ];
				img[ BROWSER_HEIGHT ] = img[ HEIGHT_UNITS ];
			}
		}

		if ( img.unitType === 'percent' ) {
			// the computed width is probably getting controlled by some applied width property CSS
			// since we now know what the pixel width the browser wants it to be, calculate its height
			// the height should be calculated with the correct aspect ratio
			// this should be re-ran every time the window width changes
			img.computedWidth = getComputedPixelWidth( img );
			img[ BROWSER_WIDTH ] = img.computedWidth;
			img[ BROWSER_HEIGHT ] = Math.round( img[ HEIGHT_UNITS ] * ( img.computedWidth / img[ WIDTH_UNITS ] ) );

			// manually assign what the calculated height pixels should be
			img.style.height = img[ BROWSER_HEIGHT ] + 'px';
		}
	},

	getComputedPixelWidth = function ( img ) {
		// code is a slimmed down version of jQuery getWidthOrHeight() and css swap()
		if ( img.offsetWidth !== 0 ) {
			return img.offsetWidth;
		} else {
			// doesn't have an offsetWidth yet, apply styles which adds display:block, but visibility hidden
			// remember what the inline values were before changing them, so you can change them back
			var ret, name,
				old = {},
				cssShow = { position: "absolute", visibility: "hidden", display: "block" };
			for ( name in cssShow ) {
				old[ name ] = img.style[ name ];
				img.style[ name ] = cssShow[ name ];
			}
			ret = img.offsetWidth;
			// change back the styles to what they were before we got the offsetWidth
			for ( name in cssShow ) {
				img.style[ name ] = old[ name ];
			}
			return ret;
		}
	},

	getComputedStyleValue = function ( element, cssProperty, jsReference ) {
		// get the computed style value for this element (but there's an IE way and the rest-of-the-world way)
		if ( !jsReference ) {
			jsReference = cssProperty;
		}
		return element.currentStyle ? element.currentStyle[ jsReference ] : document.defaultView.getComputedStyle( element, null ).getPropertyValue( cssProperty );
	},

	dimensionStyleEle,
	applyDimensionCssRules = function ( dimensionCssRules, cssRules ) {
		if ( !dimensionStyleEle ) {
			// build a new style element to hold all the dimension CSS rules
			// add the new style element to the head element
			dimensionStyleEle = document.createElement( 'style' );
			dimensionStyleEle.setAttribute( 'type', 'text/css' );
		}

		cssRules = dimensionCssRules.join( '' );

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
		formatReplace = [ 'src', 'protocol', 'host', 'port', 'directory', 'file', 'filename', 'ext', 'query', REQUEST_WIDTH, REQUEST_HEIGHT, SCALE, SCALE_ROUNDED ],
		newSrc = img[ URI_TEMPLATE ];

		// parse apart the original src URI
		img.uri = parseUri( img.orgSrc );

		// add in a few more properties we'll need for the find/replace later
		img.uri.src = img.orgSrc;
		img.uri[ REQUEST_WIDTH ] = img[ REQUEST_WIDTH ];
		img.uri[ REQUEST_HEIGHT ] = img[ REQUEST_HEIGHT ];
		img.uri[ SCALE ] = img[ SCALE ];
		img.uri[ SCALE_ROUNDED ] = img[ SCALE_ROUNDED ];

		// loop through all the possible format keys and 
		// replace them with their respective value for this image
		for ( f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img.uri[ formatReplace[ f ] ] );
		}

		// set the new src, begin the request for this image
		img.src = newSrc; 
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
		uri.ext = ( fileSplt.length > 1 ? fileSplt[ fileSplt.length - 1 ] : '' );

		return uri;
	},

	replaceUriValues = function ( img ) {
		// replace values already in the image src with values coming from the url-replace() CSS
		img[ URI_FIND ] = img[ URI_FIND ]
							.replace( '{browserWidth}', img[ WIDTH_UNITS ] )
							.replace( '{browserHeight}', img[ HEIGHT_UNITS ] );

		var
		f,
		newSrc = img.orgSrc.replace( img[ URI_FIND ], img[ URI_REPLACE ] ),
		formatReplace = [ REQUEST_WIDTH, REQUEST_HEIGHT, SCALE, SCALE_ROUNDED ];

		// loop through all the possible format keys and 
		// replace them with their respective value for this image
		for ( f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img[ formatReplace[ f ] ] );
		}

		// set the new src, begin the request for this image
		img.src = newSrc; 
	},

	imgResponseError = function ( img ) {
		img = this;
		img.className = img.className.replace( hiResClassname, lowResClassname );
		img[ SRC_MODIFICATION ] = 'response-error';
		if ( img.hasError || img.src === img.orgSrc ) return;
		img.hasError = TRUE;
		img.src = img.orgSrc;
	},

	initSpeedTest = function () {
		// only check the connection speed once, if there is a status then we've
		// already got info or it already started
		if ( speedConnectionStatus ) return;

		// force that this device has a low or high bandwidth, used more so for debugging purposes
		if ( opts.forcedBandwidth ) {
			foresight[ BANDWIDTH ] = opts.forcedBandwidth;
			foresight[ CONNECTION_TEST_RESULT ] = 'forced';
			speedConnectionStatus = STATUS_COMPLETE;
			return;
		}

		// if the device pixel ratio is 1, then no need to do a network connection 
		// speed test since it can't show hi-res anyways
		if ( foresight[ DEVICE_PIXEL_RATIO ] === 1 ) {
			foresight[ CONNECTION_TEST_RESULT ] = 'skip';
			speedConnectionStatus = STATUS_COMPLETE;
			return;
		}

		// if we know the connection is 2g or 3 (configured by options.knownSlowConnections) 
		//don't even bother with the speed test, cuz its slow
		foresight[ CONNECTION_TYPE ] = ( navigator.connection && navigator.connection.type ? navigator.connection.type.toString().toLowerCase() : 'unknown' );
		if ( foresight[ CONNECTION_TYPE ] !== 'unknown' ) {
			for ( var c = 0; c < knownSlowConnections.length; c ++ ) {
				if ( foresight[ CONNECTION_TYPE ].indexOf( knownSlowConnections[ c ] ) > -1 ) {
					foresight[ CONNECTION_TEST_RESULT ] = 'connTypeSlow';
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
				if ( ( new Date() ).getTime() < fsData.exp ) {
					// already have connection data within our desired timeframe
					// use this recent data instead of starting another test
					foresight[ BANDWIDTH ] = fsData.bw;
					foresight[ CONNECTION_KBPS ] = fsData.kbps;
					foresight[ CONNECTION_TEST_RESULT ] = 'localStorage';
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

			foresight[ CONNECTION_KBPS ] = ( ( speedTestKB * 1024 * 8 ) / duration ) / 1024;
			foresight[ BANDWIDTH ] = ( foresight[ CONNECTION_KBPS ] >= minKbpsForHighBandwidth ? 'high' : 'low' );

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
		// than it isn't a 'high-bandwidth' and ignore what the test image .onload has to say
		// this is used so we don't wait too long on a speed test response 
		// Adding 350ms to account for TCP slow start, quickAndDirty === TRUE
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
		foresight[ CONNECTION_TEST_RESULT ] = connTestResult;

		try {
			if ( !expireMinutes ) {
				expireMinutes = speedTestExpireMinutes;
			}
			var fsDataToSet = {
				kbps: foresight[ CONNECTION_KBPS ],
				bw: foresight[ BANDWIDTH ],
				exp: ( new Date() ).getTime() + (expireMinutes * 60000)
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
		if ( lastWindowWidth !== getWindowWidth() ) {
			foresight.reload();
		}
	},

	getWindowWidth = function () {
		return document.documentElement.clientWidth || document.body && document.body.clientWidth || 1024;
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
		reloadTimeoutId = window.setTimeout( executeReload, 250 ); 
	};

	// when the DOM is ready begin finding valid foresight <img>'s and updating their src's
	foresight.ready = function () {
		if ( !document.body ) {
			return window.setTimeout( ready, 1 );
		}
		initForesight();
	};
	if ( document.readyState === STATUS_COMPLETE ) {
		setTimeout( fsReady, 1 );
	} else {
		if ( document.addEventListener ) {
			document.addEventListener( "DOMContentLoaded", foresight.ready, FALSE );
			window.addEventListener( "load", foresight.ready, FALSE );
		} else if ( document.attachEvent ) {
			document.attachEvent( "onreadystatechange", foresight.ready );
			window.attachEvent( "onload", foresight.ready );
		}
	}
	
	// get this device's pixel ratio
	foresight[ DEVICE_PIXEL_RATIO ] = window[ DEVICE_PIXEL_RATIO ] ? window[ DEVICE_PIXEL_RATIO ] : 1;

	if ( opts.forcedPixelRatio ) {
		// force a certain device pixel ratio, used more so for debugging purposes
		foresight[ DEVICE_PIXEL_RATIO ] = opts.forcedPixelRatio;
	}
	
	foresight[ DEVICE_PIXEL_RATIO_ROUNDED ] = Math.round( foresight[ DEVICE_PIXEL_RATIO ] );

	// DOM does not need to be ready to begin the network connection speed test
	initSpeedTest();

	// add a listener to the window.resize event
	addWindowResizeEvent();

} ( foresight = foresight || {}, this, document, navigator ) );