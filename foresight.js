; ( function ( window, document ) {
	"use strict";

	window.foresight = window.foresight || {};

	// properties
	var fs = window.foresight;
	fs.devicePixelRatio = ( ( window.devicePixelRatio && window.devicePixelRatio > 1 ) ? window.devicePixelRatio : 1 );
	fs.isHighSpeedConn = false;
	fs.connKbps = 1;
	fs.connTestMethod = undefined;
	fs.images = [];
	fs.oncomplete = fs.oncomplete || undefined;

	// options
	fs.options = fs.options || {};
	var opts = fs.options;
	opts.srcModification = opts.srcModification || 'rebuildSrc';
	opts.srcFormat = opts.srcFormat || '{protocol}://{host}{directory}{file}';
	opts.testConn = opts.testConn || true;
	opts.minKbpsForHighSpeedConn = opts.minKbpsForHighSpeedConn || 400;
	opts.speedTestUri = opts.speedTestUri || 'speed-test/100K.jpg';
	opts.speedTestKB = opts.speedTestKB || 100;
	opts.speedTestExpireMinutes = opts.speedTestExpireMinutes || 30;

	var
	imageIterateStatus,
	speedConnectionStatus,
	STATUS_LOADING = 'loading',
	STATUS_COMPLETE = 'complete',

	initScan = function() {
		if ( imageIterateStatus ) return;

		imageIterateStatus = STATUS_LOADING;
		iterateChildElements( document.body );
		imageIterateStatus = STATUS_COMPLETE;

		if ( fs.images.length > 0 ) {
			initImageRebuild();
		} else {
			if ( fs.oncomplete ) {
				fs.oncomplete();
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
			childEle = parentEle.childNodes[ x ];

			if ( childEle.nodeName !== '#text' ) {
				if ( childEle.nodeName === 'NOSCRIPT' ) {
					if ( childEle.getAttribute( 'data-img-src' ) !== null ) {
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
		if ( fs.devicePixelRatio == 1 ) {
			fs.connTestMethod = 'skip';
			speedConnectionStatus = STATUS_COMPLETE;
			return;
		}

		var lsKey = 'foresight.js';
		// set if a speed test has recently been completed in the global storage
		// localStorage.removeItem( lsKey );
		try {
			var fsData = JSON.parse( localStorage.getItem( lsKey ) );
			if ( fsData && fsData.isHighSpeedConn ) {
				var minuteDifference = ( ( new Date() ).getTime() - fsData.timestamp ) / 1000 / 60;
				if ( minuteDifference < opts.speedTestExpireMinutes ) {
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
		startTime;

		speedTestImg.onload = function() {
			// image download completed
			endTime = ( new Date() ).getTime();

			var duration = Math.round( ( endTime - startTime ) / 1000 );
			duration = ( duration > 1 ? duration : 1 );

			var bitsLoaded = ( opts.speedTestKB * 1024 * 8 );

			fs.connKbps = ( Math.round( bitsLoaded / duration ) / 1024 );

			fs.isHighSpeedConn = ( fs.connKbps >= opts.minKbpsForHighSpeedConn );

			try {
				var fsDataToSet = {
					connKbps: fs.connKbps,
					isHighSpeedConn: fs.isHighSpeedConn,
					timestamp: endTime
				};
				localStorage.setItem( lsKey, JSON.stringify( fsDataToSet ) );
			} catch( e ) { }

			fs.connTestMethod = 'network';
			speedConnectionStatus = STATUS_COMPLETE;
			initImageRebuild();
		};

		speedTestImg.onerror = function() {
			// fallback incase there was an error getting the test image
			fs.connKbps = 0;
			fs.isHighSpeedConn = false;

			fs.connTestMethod = 'networkError';
			speedConnectionStatus = STATUS_COMPLETE;
			initImageRebuild();
		};

		// begin the speed test image download
		startTime = ( new Date() ).getTime();
		speedConnectionStatus = STATUS_LOADING;
		speedTestImg.src = opts.speedTestUri + "?r=" + Math.random();
	},

	setImage = function ( noScriptEle ) {
		// this will only run once
		initSpeedTest();

		var img = document.createElement( 'img' );
		img.noScriptEle = noScriptEle;

		fillProp( img, 'src', 'orgSrc' );
		fillProp( img, 'width', 'width', true );
		fillProp( img, 'height', 'height', true );

		if ( !img.orgSrc || !img.width || !img.height ) return;

		fillProp( img, 'class', 'className', false, '' );
		fillProp( img, 'src-modification', 'srcModification', false, opts.srcModification );
		fillProp( img, 'src-format', 'srcFormat', false, opts.srcFormat );
		fillProp( img, 'pixel-ratio', 'pixelRatio', true, fs.devicePixelRatio );
		fillProp( img, 'id', 'id', false, ('fsImg' + Math.floor( Math.random() * 1000000000) ) );

		fs.images.push( img );
	},

	fillProp = function( img, attrName, propName, getFloat, defaultValue ) {
		var value = img.noScriptEle.getAttribute( 'data-img-' + attrName );
		if ( value && value !== '' ) {
			if ( getFloat && !isNaN( value ) ) {
				value = parseFloat( value, 10 );
			}
		} else {
			value = defaultValue;
		}
		img[ propName ] = value;
	},

	initImageRebuild = function() {
		if ( speedConnectionStatus !== STATUS_COMPLETE || imageIterateStatus !== STATUS_COMPLETE ) return;

		var
		x,
		img;

		for ( x = 0; x < fs.images.length; x++ ) {
			img = fs.images[ x ];

			img.requestWidth = Math.round( img.width * img.pixelRatio );
			img.requestHeight = Math.round( img.height * img.pixelRatio );

			if ( img.srcModification === 'rebuildSrc' && img.srcFormat ) {
				rebuildSrc( img );
			} else if ( img.srcModification === 'replaceDimensions' ) {
				replaceDimensions( img );
			} else {
				return;
			}

		}

		insertImages();
	},

	rebuildSrc = function( img ) {
		img.uri = parseUri( img.orgSrc );
		img.uri.width = img.requestWidth;
		img.uri.height = img.requestHeight;
		img.uri.pixelRatio = img.pixelRatio;
		var formatReplace = [ 'protocol', 'host', 'port', 'directory', 'file', 'query', 'width', 'height', 'pixelRatio' ];
		var newSrc = img.srcFormat;
		for ( var f = 0; f < formatReplace.length; f++ ) {
			newSrc = newSrc.replace( '{' + formatReplace[ f ] + '}', img.uri[ formatReplace[ f ] ] );
		}
		img.src = newSrc;
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

		return uri;
	},

	replaceDimensions = function( img ) {
		img.src = img.orgSrc
					.replace( img.width, img.requestWidth )
					.replace( img.height, img.requestHeight );
	},

	insertImages = function() {
		var
		x,
		img;

		for ( x = 0; x < fs.images.length; x++ ) {
			img = fs.images[ x ];
			img.noScriptEle.parentElement.insertBefore( img, img.noScriptEle );
		}

		if ( fs.oncomplete ) {
			fs.oncomplete();
		}
	};

	if ( document.readyState === STATUS_COMPLETE ) {
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
} ( this, document ) );