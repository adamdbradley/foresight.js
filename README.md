### Introduction
The __foresight.js__ gives webpages the ability to see if the user's device is capable of viewing high-resolution displays (such as the 3rd generation iPad), and if the device currently has a fast enough network connection. Depending on display and network connectivity, __foresight.js__ will request the appropriate image.

This project's overall goal is to solve these current issues faced by web developers: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images).

### Features
* Request hi-res images according to device pixel ratio
* Detect network connection speed
* Javascript Framework independent (ie: jQuery not required)
* Customizable through configuration options
* Does not make multiple requests for the same image
* Default images load without javascript enabled

### HTML
One of the largest problems faced with dynamically deciding image quality is that by the time javascript is capable of viewing the DOM, any _img_ element in the DOM has already been requested from the server. And on the flip side to that, if _img_ elements are built by javascript then they probably won't be viewed by search engines and browsers without javascript enabled will not be able to view the images. To overcome both of these challenges foresight.js uses the _noscript_ element with a child _img_ element.

    <noscript data-img-src="imagefile.jpg" data-img-width="320" data-img-height="240">
        <img src="imagefile.jpg" width="320" height="240"/>
    </noscript>

### NoScript Attributes and Inner Content
For foresight.js to use the _noscript_ element it requires three attributes: _data-img-src_,  _data-img-width_,  _data-img-height_. These attributes act the same as their respective attributes in an _img_ element.

The child _img_ element within the _noscript_ is the fallback image incase javascript is not enabled, and for search engines to view the default image. (Note: It'd be great to just use the _noscript_ child _img_ to get the image information from instead of duplicating it in the _noscript_ attributes, except IE7 and IE8 does not put _noscript_ inner text info into the DOM.)