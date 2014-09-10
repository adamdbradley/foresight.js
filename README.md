## DEPRECATED:

Foresight.js was originally introduced when the first iPad with Retina display was announced in 2012. It helped solve the problem of providing the optimal image for the device, with the goal to decrease image loading time, and to not waste bandwidth.

Since then however, the [picture element](https://developers.google.com/web/fundamentals/media/images/images-in-markup#art-direction-in-responsive-images-with-picture) has been working its way through the [standards](http://www.w3.org/html/wg/drafts/html/master/embedded-content.html#the-picture-element) and is actively being [implemented](http://blog.chromium.org/2014/08/chrome-38-beta-new-primitives-for-next.html) by browsers. It's recommended to use [picture element polyfill](https://github.com/scottjehl/picturefill), rather than this out-dated solution.

## Old Intro

__Foresight.js__ gives webpages the ability to tell if the user's device is capable of viewing high-resolution images (such as the 3rd generation iPad) before the image has been requested from the server. Additionally, it judges if the user's device currently has a fast enough network connection for high-resolution images. Depending on device display and network connectivity, __foresight.js__ will request the appropriate image for the webpage. By customizing the _img_ _src_ attribute using methods such as URI templates, or finding and replacing values within the URI, it is able to form requests built for your image's resolution variants. Media queries however, could be used when dealing with CSS background-images, while foresight.js is used to handle inline _img_ elements (or until current web standards are improved). Recently __Washington Post__ implemented foresight.js to determine hi-res/responsive images on their [mobile site](http://m.washingtonpost.com/).

Foresight's methods centralizes how to configure image variants across your entire site (compared to hard-coding each image variant's src and its dimensions into markup on every page), and specifically uses a hybrid implementation of the [new CSS image-set() function](http://blog.cloudfour.com/safari-6-and-chrome-21-add-image-set-to-support-retina-images/). 

This project's overall goal is to tackle these current issues faced by web developers designing for hi-res: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images). Foresight.js aims at providing a lightweight, cross-browser and framework independent tool for a __high-resolution web on today's browsers__. 

For a small set of CSS classnames to help keep images cropped on the focal point check out [Focal Point](https://github.com/adamdbradley/focal-point).

## Features
* Request hi-res images according to device pixel ratio
* Estimates network connection speed prior to requesting an image
* Allows existing CSS techniques to control an image's dimensions within the browser
* Implements image-set() CSS to control image resolution variants
* Does not make multiple requests for the same image
* Javascript library and framework independent (ie: jQuery not required)
* Image dimensions set by percents will scale to the parent element's available width
* Default images will load without javascript enabled
* Does not use device detection through user-agents
* Minifies to 7K

__Contact Me__

* [@adamdbradley](https://twitter.com/adamdbradley)

## References/Resources

* [Focal Point](https://github.com/adamdbradley/focal-point): A small set of CSS classnames to help keep images cropped on the focal point for responsive designs
* [Safari 6 and Chrome 21 add image-set to support retina images](http://blog.cloudfour.com/safari-6-and-chrome-21-add-image-set-to-support-retina-images/)
* [Using CSS to control image variants](http://www.w3.org/community/respimg/2012/04/08/using-css-to-control-image-variants/)
* [Responsive Images Community Group](http://www.w3.org/community/respimg/)
* [Adaptive Image Element](https://gist.github.com/2159117)
* [Polyfilling picture without the overhead](http://www.w3.org/community/respimg/2012/03/15/polyfilling-picture-without-the-overhead/)
* [The image-set() function (for responsive images)](http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html)
* [URI Template: RFC 6570](http://tools.ietf.org/html/rfc6570)

## License

Copyright (c) 2012 Adam Bradley

Licensed under the MIT license.

