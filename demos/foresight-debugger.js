// DEMO JAVASCRIPT ONLY
// this is not required to use foresight.js, this is here only to help view info about the images

var foresight_debugger = function () {
	// oncomplete only being use to print out debugger info, demo purposes only
	var info = [];

	info.push( 'Foresight Images: ' + foresight.images.length );
	info.push( 'Device Pixel Ratio: ' + foresight.devicePixelRatio );
	info.push( 'Connection Test Method: ' + foresight.connTestMethod );
	if( foresight.connTestMethod === 'skip' ) {
		info.push( 'No speed test because this device has a pixel ratio of 1, so no need' );
	} else {
		info.push( 'Estimated Connection Speed: ' + foresight.connKbps + 'Kbps' );
		info.push( 'Is Considered High Speed Connection: ' + foresight.isHighSpeedConn );
	}
	info.push( 'High-Resolution Enabled: ' + foresight.hiResEnabled );
	info.push( '<hr>' );

	// add in a <pre> element or use one already there for the big info
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
		imgInfo.push( 'Image\'s Browser Width/Height: ' + img.width + 'x' + img.height );
		imgInfo.push( 'Image\'s Requested Width/Height: ' + img.requestWidth + 'x' + img.requestHeight );
		imgInfo.push( 'Image\'s Parent Width/Height: ' + img.parentElement.clientWidth + 'x' + img.parentElement.clientHeight );

		imgInfo.push( 'Src Modification Method: ' + img.srcModification );
		if( img.srcModification === 'rebuildSrc' ) {
			imgInfo.push( 'Src Format: ' + img.srcFormat );
		}
		imgInfo.push( 'Requested Src: <a href="' + img.src + '">' + img.src + '</a>' );

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