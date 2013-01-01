## Introduction
__Foresight.js__ gives webpages the ability to tell if the user's device is capable of viewing high-resolution images (such as the 3rd generation iPad) before the image has been requested from the server. Additionally, it judges if the user's device currently has a fast enough network connection for high-resolution images. Depending on device display and network connectivity, __foresight.js__ will request the appropriate image for the webpage. By customizing the _img_ _src_ attribute using methods such as URI templates, or finding and replacing values within the URI, it is able to form requests built for your image's resolution variants. Media queries however, could be used when dealing with CSS background-images, while foresight.js is used to handle inline _img_ elements (or until current web standards are improved). Recently __Washington Post__ implemented foresight.js to determine hi-res/responsive images on their [mobile site](http://m.washingtonpost.com/).

Foresight's methods centralizes how to configure image variants across your entire site (compared to hard-coding each image variant's src and its dimensions into markup on every page), and specifically uses a hybrid implementation of the [new CSS image-set() function](http://blog.cloudfour.com/safari-6-and-chrome-21-add-image-set-to-support-retina-images/). 

This project's overall goal is to tackle these current issues faced by web developers designing for hi-res: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images). Foresight.js aims at providing a lightweight, cross-browser and framework independent tool for a __high-resolution web on today's browsers__. Please feel free to contact me ([@adamdbradley](https://twitter.com/adamdbradley)) or contribute to this project to help improve it. I also put together this slide deck to help explain hi-res: [Responding to the New High-Resolution Web: Considerations for High-Density Displays](http://goo.gl/Zo4XF).

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


## Demos
Currently most desktop and laptops do not have high-resolution displays and are limited to a device pixel ratio of only 1, so you will not be able to see the effects on a standard monitor. Make sure you view the demos from multiple devices, such as your mobile phone, tablet and traditional computer.

* [Foresight.js Demos](http://www.cdnconnect.com/docs/foresightjs/demos)


## Documentation

All documentation can be found at [CDNConnect.com](http://www.cdnconnect.com/docs/foresightjs)


## Contribute

This project was originally created as a need for an ecommerce mobile homepage, which basically showed high-resolution images for high-resolution devices, and adjust image widths accordingly. This is by no means the end-all solution for high-resolution images; I'd label this more as an interim solution as the web standards evolve for handling device pixel ratios. Please feel free to improve this project in any way you can.

__Contact Me__

* [@adamdbradley](https://twitter.com/adamdbradley)


## Bug tracker

Find a bug? Please create an issue here on GitHub!

[Submit an issue](https://github.com/adamdbradley/foresight.js/issues)


## Presentation

* [Responding to the New High-Resolution Web: Considerations for High-Density Displays](http://goo.gl/Zo4XF)

## References/Resources

* [CDNConnect](http://www.cdnconnect.com/): Production File Management & Fast Content Delivery For The Team
* [Focal Point](https://github.com/adamdbradley/focal-point): A small set of CSS classnames to help keep images cropped on the focal point for responsive designs
* [Safari 6 and Chrome 21 add image-set to support retina images](http://blog.cloudfour.com/safari-6-and-chrome-21-add-image-set-to-support-retina-images/)
* [Using CSS to control image variants](http://www.w3.org/community/respimg/2012/04/08/using-css-to-control-image-variants/)
* [Responsive Images Community Group](http://www.w3.org/community/respimg/)
* [Adaptive Image Element](https://gist.github.com/2159117)
* [Polyfilling picture without the overhead](http://www.w3.org/community/respimg/2012/03/15/polyfilling-picture-without-the-overhead/)
* [The image-set() function (for responsive images)](http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html)
* [URI Template: RFC 6570](http://tools.ietf.org/html/rfc6570)

## License

Copyright (c) 2012 Adam Bradley [CDNConnect.com](http://www.cdnconnect.com/docs/foresightjs)

Licensed under the MIT license.

