## Introduction
The __foresight.js__ gives webpages the ability to see if the user's device is capable of viewing high-resolution displays (such as the 3rd generation iPad), and if the device currently has a fast enough network connection. Depending on display and network connectivity, __foresight.js__ will request the appropriate image.

This project's overall goal is to solve these current issues faced by web developers: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images).



## Features
* Request hi-res images according to device pixel ratio
* Detect network connection speed
* Javascript Framework independent (ie: jQuery not required)
* Image dimensions by percents scale to the device's available width and display pixel ratio
* Customizable through configuration options
* Does not make multiple requests for the same image
* Default images load without javascript enabled
* Minifies down to roughly 5K



## HTML
One of the largest problems faced with dynamically deciding image quality is that by the time javascript is capable of viewing the DOM, any _img_ element in the DOM has already been requested from the server. And on the flip side to that, if _img_ elements are built by javascript then they probably won't be viewed by search engines and browsers without javascript enabled will not be able to view the images. To overcome both of these challenges foresight.js uses the _noscript_ element with a child _img_ element.

    <noscript data-img-src="imagefile.jpg" data-img-width="320" data-img-height="240">
        <img src="imagefile.jpg" width="320" height="240"/>
    </noscript>



## NoScript Element
For foresight.js to use the _noscript_ element it requires three attributes: _data-img-src_,  _data-img-width_,  _data-img-height_. These attributes act the same as their respective attributes in an _img_ element.

The child _img_ element within the _noscript_ is the fallback image incase javascript is not enabled, and for search engines to view the default image. (Note: It'd be great to just use the _noscript_ child _img_ to get the image information from instead of duplicating it in the _noscript_ attributes, except IE7 and IE8 does not put _noscript_ inner text info into the DOM.)



## High-Speed Network Connection Test
Currently most devices capable of hi-res displays are mobile devices, such as new iPhones or iPads. However, since they are "mobile" and their data may be relying on cell towers, even if the device has a hi-res display,  users with slow connectivity probably do not want to wait a long time while images download. In these cases, foresight.js does a quick network speed test to make sure your the user's device can handle hi-res images. Additionally, it stores the devices network connection speed information for 30 minutes (or any customizable to any expiration period you'd like) so it does not continually make requests. You can host your own speed test file to be downloaded, or you can use the default URI available for public use found in the foresight configuration.



## Src Modification
An _img src_ needs to be modified so the browser can request the correct image according to the device and network speed. How an image's src is formatted is entirely up to the URI format of the server, but foresight.js allows the _img src_ attribute to be customized to meet various formats.

Src modification types can be assigned in the _foresight.options.srcModification_ config, or individually for each image using the _noscript data-img-src-modification_ attribute. The possible values are __replaceDimensions__ or __rebuildSrc__ and described below.

__replaceDimensions__: The current src may already have dimensions within the URI. Instead of rebuilding the src entirely, just find and replace the original dimensions with the new dimensions. 

__rebuildSrc__: Rebuild the src by parsing apart the current URI and rebuilding it using the supplied _src format_. Review the Src Format section to see how to format the image URI's.


## Src Format
The src format is only required when using the _rebuildSrc_ src modification. The src format provides foresight with how the request image should be built. Each server's image request is different and the _srcFormat_ value allows the URI to be customized. The format can either be in the _foresight.options.srcFormat_ config, or individually for each image using the _noscript data-img-src-format_ attribute. Below are the various keys which are used to rebuild the src to request the correct image from the server. Each one is not required, and you should only use the keys which help build the src request for the server.

__{protocol}__: The protocol of the request. ie: _http_ or _https_

__{host}__: The host. ie: _www.wikipedia.com_ or _cdn.mysite.com_

__{port}__: The port number, but production systems will rarely use this. ie: _80_

__{directory}__: The directory (folder) within the path. ie: _/images/_

__{file}__: The filename of the image. ie: _myimage.jpg_

__{query}__: The querystring. ie: _page=1&size=10_

__{requestWidth}__: The requested width of the image to load. This value will automatically be calculated, its just that you need to tell foresight.js where to put this info in the src. ie: _320_

__{requestHeight}__: The requested height of the image to load. This value will automatically be calculated, its just that you need to tell foresight.js where to put this info in the src. ie: _480_

__{pixelRatio}__: The requested pixel ratio of the image to load. This value will automatically be calculated, its just that you need to tell foresight.js where to put this info in the src. ie: _480_

__Again, not all of these keys are required inside your src URI. Src format is entirely dependant on how the server handles request URIs.__

#### Src Format Examples


## NoScript Attributes
__data-img-src__: _(Required)_ The src attribute of the image, which is the location image on the server.

__data-img-width__: _(Required)_ The pixel width according to the browser. Any adjusting to the device pixel ratio will be taken care of and request image automatically adjusted. Both _data-img-width_ and _data-img-height_ are required so we can always proportionally scale the image.

__data-img-height__: _(Required)_ The pixel height according to the browser. Any adjusting to the device pixel ratio will be taken care of and request image automatically adjusted. Both _data-img-width_ and _data-img-height_ are required so we can always proportionally scale the image.

__data-img-src-modification__: _(Optional)_ An image's src 

__data-img-id__: _(Optional)_ The _img id_ attribute. If one is not assigned it will be assigned an _id_ attribute starting with 'fsImg' then followed by a random number.

__data-img-class__: _(Optional)_ The _img class_ attribute which can hold CSS class names.

__data-img-max-width__: _(Optional)_ Maximum browser pixel width this image should take. If this value is greater than the width it will scale the image proportionally.

__data-img-max-height__: _(Optional)_ Maximum browser pixel height this image should take. If this value is greater than the height it will scale the image proportionally.

__data-img-pixel-ratio__: _(Optional)_ By default an image's pixel ratio is figured out using the devices pixel ratio. You can however manually assign an image's pixel ratio which will override the default.

