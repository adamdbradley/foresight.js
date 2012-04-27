// DEMO JAVASCRIPT ONLY
// this is not required to use foresight.js, this is here only to help view info about the images


var initForesightDebugger = function () {
	// oncomplete only being use to print out debugger info, demo purposes only
	var info = [];

	info.push( 'Foresight Images: ' + foresight.images.length );
	info.push( 'Device Pixel Ratio: ' + foresight.devicePixelRatio + ', Device Pixel Ratio Rounded: ' + foresight.devicePixelRatioRounded );
	info.push( 'Connection Test Result: ' + foresight.connTestResult );
	if( foresight.connTestResult !== 'skip' && foresight.connTestResult !== 'forced' ) {
		info.push( 'Connection Type: ' + foresight.connType );
		info.push( 'Estimated Connection Speed: ' + foresight.connKbps + 'Kbps' );
	} else if( foresight.connTestResult === 'skip' && foresight.devicePixelRatio == 1 ) {
		info.push( 'Bandwidth test skipped because this display has a device pixel ratio of 1' );
	}

	//if( foresight.devicePixelRatio > 1 ) {
	//	info.push( 'Force this page to <em>think</em> it has a device pixel ratio of 1: <a href="?dpr=1">Force DPR 1</a>' );
	//} else {
	//	info.push( 'Force this page to <em>think</em> it has a device pixel ratio of 2: <a href="?dpr=2">Force DPR 2</a>' );
	//}

	if ( foresight.bandwidth ) {
		info.push( 'Bandwidth: ' + foresight.bandwidth );
	}
	info.push( '<hr>' );

	// add in a <pre> element or use one already there for debugging info
	var docPres = document.getElementsByTagName('pre');
	if( docPres && docPres.length ) {
		var docPre = docPres[ 0 ];
	} else {
		var docPre = document.createElement( 'pre' );
		docPre.className = "foresight-debug global";
		if( foresight.images.length ) {
			foresight.images[ 0 ].parentNode.insertBefore( docPre, foresight.images[ 0 ] );
		} else {
			document.body.appendChild( docPre );
		}
	}
	docPre.innerHTML = info.join( '<br>' );


	// print out img info above each foresight image
	for( var x = 0; x < foresight.images.length; x++ ) {
		var img = foresight.images[ x ];
		
		if ( !img.requestChange ) {
			continue;
		}
		
		var imgInfo = [];
		imgInfo.push( 'Dimension Unit Type: ' + img.unitType );
		if ( img.computedWidth ) {
			imgInfo.push( 'Computed Width: ' + img.computedWidth );
		}
		imgInfo.push( 'Browser Width/Height: ' + img.browserWidth + ' x ' + img.browserHeight );
		imgInfo.push( 'Request Width/Height: ' + img.requestWidth + ' x ' + img.requestHeight );
		if ( img.naturalWidth && img.naturalHeight ) {
			imgInfo.push( 'Natural Width/Height: ' + img.naturalWidth + ' x ' + img.naturalHeight );
		}

		imgInfo.push( 'Default: ' + img.defaultSrc);
		imgInfo.push( 'Applied Image-set item: Scale: ' + img.appliedImageSetItem.scale + ', Scale Rounded: ' + img.appliedImageSetItem.scaleRounded + ', Bandwidth: ' + img.appliedImageSetItem.bandwidth );
		imgInfo.push( 'Src Modification: ' + img.srcModification );
		
		if ( img.highResolutionSrc && foresight.hiResEnabled ) {
			imgInfo.push( 'Hi-Res Src Attribute: ' + img.highResolutionSrc );
		} else if( img.srcModification === 'src-uri-template' ) {
			imgInfo.push( 'URI Template: ' + img.appliedImageSetItem.uriTemplate );
		} else if( img.srcModification === 'src-find-replace' ) {
			imgInfo.push( 'URI Find/Replace: Find: ' + img.appliedImageSetItem.uriFind + ', Replace: ' + img.appliedImageSetItem.uriReplace );
		} else if( img.srcModification === 'response-error' ) {
			imgInfo.push( 'Modified updated src had a response error, request the original src instead' );
		}

		imgInfo.push( 'Request: ' + img.src);

		if ( !img.infoElement ) {
			img.infoElement = document.createElement( 'div' );
			img.parentNode.insertBefore(img.infoElement, img);
		}
		
		var newInfoElement = document.createElement( 'pre' );
		newInfoElement.className = "foresight-debug local";
		newInfoElement.innerHTML = imgInfo.join( '<br>' );
		img.infoElement.appendChild(newInfoElement);
	}

};

var foresightDebugger = function () {
	// kick off the debugger when the window has been loaded
	if ( document.readyState === 'complete' ) {
		initForesightDebugger();
	} else {
		if ( document.addEventListener ) {
			window.addEventListener( "load", initForesightDebugger, false );
		} else if ( document.attachEvent ) {
			window.attachEvent( "onload", initForesightDebugger );
		}
	}
}


window.foresight = window.foresight || {};

window.foresight.updateComplete = foresightDebugger;

window.foresight.options = window.foresight.options || {};


// You can set your own variables both bandwidth and device pixel ratio

// Querystring dpr sets the device pixel ratio, possible values: 1.5 and 2
// Querystring bw sets the bandwidth, possible values: low and high


if ( window.location.search.indexOf( 'dpr=2' ) > -1 ) {
	window.foresight.options.forcedPixelRatio = 2
} else if ( window.location.search.indexOf( 'dpr=1.5' ) > -1 ) {
	window.foresight.options.forcedPixelRatio = 1.5
}

if ( window.location.search.indexOf( 'bw=low' ) > -1 ) {
	window.foresight.options.forcedBandwidth = 'low'
} else if ( window.location.search.indexOf( 'bw=high' ) > -1 ) {
	window.foresight.options.forcedBandwidth = 'high'
}





