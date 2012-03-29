// DEMO JAVASCRIPT ONLY
// this is not required to use foresight.js, this is here only to help view info about the images

var foresight_debugger = function () {
	// oncomplete only being use to print out debugger info, demo purposes only
	var info = [];

	info.push( 'Foresight Images: ' + foresight.images.length );
	info.push( 'Device Pixel Ratio: ' + foresight.devicePixelRatio );
	info.push( 'Connection Test Result: ' + foresight.connTestResult );
	if( foresight.connTestResult === 'skip' ) {
		info.push( 'No speed test because this device has a pixel ratio of 1, so no need' );
	} else {
		info.push( 'Connection Type: ' + foresight.connType );
		info.push( 'Estimated Connection Speed: ' + foresight.connKbps + 'Kbps' );
		info.push( 'Is Considered High Speed Connection: ' + foresight.isHighSpeedConn );
	}
	info.push( 'High-Resolution Enabled: ' + foresight.hiResEnabled );
	info.push( '<hr>' );

	// add in a <pre> element or use one already there for debugging info
	var docPres = document.getElementsByTagName('pre');
	if(docPres && docPres.length) {
		var docPre = docPres[0];
	} else {
		var docPre = document.createElement( 'pre' );
		if(foresight.images.length) {
			foresight.images[0].parentElement.insertBefore(docPre, foresight.images[0]);
		} else {
			document.body.appendChild(docPre);
		}
	}
	docPre.innerHTML = info.join( '<br>' );

	// print out img info above each foresight image
	for( var x = 0; x < foresight.images.length; x++ ) {
		var img = foresight.images[ x ];
		var imgInfo = [];
		imgInfo.push( 'Original Src: <a href="' + img.orgSrc + '">' + img.orgSrc + '</a>');
		imgInfo.push( 'Browser Width/Height: ' + img.browserWidth + 'x' + img.browserHeight );
		imgInfo.push( 'Rendered Width/Height: ' + img.width + 'x' + img.height );
		imgInfo.push( 'Request Width/Height: ' + img.requestWidth + 'x' + img.requestHeight );
		imgInfo.push( 'Parent Width/Height: ' + img.parentWidth + 'x' + img.parentHeight );
		if ( img.widthPercent ) {
			imgInfo.push( 'Width Percent: ' + img.widthPercent );
		}
		if ( img.heightPercent ) {
			imgInfo.push( 'Height Percent: ' + img.heightPercent );
		}
		imgInfo.push( 'Max Browser Width/Height: ' + img.maxWidth + 'x' + img.maxHeight );
		imgInfo.push( 'Max Request Width/Height: ' + img.maxRequestWidth + 'x' + img.maxRequestHeight );
		imgInfo.push( 'Image Hi-res Enabled: ' + img.hiResEnabled );

		if ( img.highResolution && foresight.hiResEnabled ) {
			imgInfo.push( 'Src Modification Method: data-src-high-resolution attribute');
			imgInfo.push( 'Hi-Res Attribute: ' + img.highResolution );
		} else {
			imgInfo.push( 'Src Modification Method: ' + img.srcModification );
			if( img.srcModification === 'rebuildSrc' ) {
				imgInfo.push( 'Src URI Template: ' + img.srcUriTemplate );
			}
		}

		imgInfo.push( 'Request Src: <a href="' + img.src + '">' + img.src + '</a>' );

		if ( img.orgSrc === img.src ) {
			imgInfo.push( 'No change to the src' );
		} else {
			imgInfo.push( 'Src has been modified' );
		}

		img.setAttribute( 'title', 'Org: ' + img.width + 'x' + img.height + ', Requested: ' + img.requestWidth + 'x' + img.requestHeight  );

		if ( !img.preElement ) {
			img.preElement = document.createElement( 'pre' );
			img.parentElement.insertBefore( img.preElement, img );
		}
		img.preElement.innerHTML = imgInfo.join( '<br>' );
	}

};