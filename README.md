## Introduction
__Foresight.js__ gives webpages the ability to tell if the user's device is capable of viewing high-resolution images (such as the 3rd generation iPad) before the image is requested. Additionally, it judges if the user's device currently has a fast enough network connection for high-resolution images. Depending on device display and network connectivity, __foresight.js__ will request the appropriate image for the webpage. Foresight deals with modifying context images, specifically _img_ elements. Media queries however should be used when dealing with CSS background-images, while foresight.js is used to handle inline _img_ elements.

This project's overall goal is to tackle these current issues faced by web developers designing for hi-res: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images). Foresight is used to modify _img src_ attributes so browsers can request the correct image for the device, it does not however, resize the images themselves. See [Server Resizing Images](//github.com/adamdbradley/foresight.js/wiki/Server-Resizing-Images) for more information on a few options for requesting various images sizes from a server.



## Features
* Request hi-res images according to device pixel ratio
* Detect network connection speed
* Does not make multiple requests for the same image
* Javascript Framework independent (ie: jQuery not required)
* Image dimensions set by percents will scale to the device's available width and display pixel ratio
* Fully customizable through global configuration options and individual img options
* Default images load without javascript enabled
* Minifies down to roughly 4K


## Demos
Before we get too far into the nitty-gritty, it's probably best to view foresight.js in action. Currently most desktop and laptops do not have high-resolution displays and are limited to a device pixel ratio of only 1, so you will not be able to see the effects on a standard monitor. Make sure you view the demos from multiple devices, such as your mobile phone, tablet and traditional computer.

* [Foresight.js Demos](http://foresightjs.appspot.com/demos/index.html)


## Img Element
One of the largest problems faced with dynamically deciding image quality is that by the time javascript is capable of viewing an _img_ in the DOM, the image file has already been requested from the server. And on the flip side, if _img_ elements are built by javascript then they probably won't be viewed by search engines and browsers without javascript enabled will not be able to view the images. To overcome both of these challenges foresight.js uses the an _img_ element, but without the _src_ attribute set, and a _noscript_ element with a child _img_ element.

    <img data-src="imagefile.jpg" width="320" height="240" class="responsive-img">
    <noscript>
        <img src="imagefile.jpg" width="320" height="240">
    </noscript>

Notice how the first image is missing the _src_ attribute, but instead has a _data-src_ attribute. Because this _img_ element does not have the _src_ attribute the browser will not attempt to download the file. Once the DOM is ready, foresight does its magic to transform the _data-src_ and set the _src_ attribute tailored to the device's display and network connectivity.

Using this structure allows us to still place _img_ elements within the context of the webpage, while also allowing search engines and javascript disabled browsers to view the images. 


## NoScript Element
Immediately you'll notice that the _noscript_ element and its child _img_ is redundant, but with today's standards this is one of the issues we'll have to dance with. Until the web community comes up with a better method, their new standard becomes widely adopted by all the major browsers, and the updated browsers are installed on the billions of devices in the world, foresight's approach is one of the few that answers each of the [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images). _There is hope however for a new 'picture' element: [ Polyfilling picture without the overhead](http://www.w3.org/community/respimg/2012/03/15/polyfilling-picture-without-the-overhead/)_

Additionally, if javascript is not enabled and the _noscript_ element is shown by the browser, the webpage should also hide the first _img_ so it doesn't show as a large blank image. The head element of the document should contain:

    <noscript>
        <style> .responsive-img { display:none }</style>
    </noscript>
    
_If your website has no reason to care about SEO or support browsers without javascript than feel free to omit the noscript elements all together._


## High-Speed Network Connection Test
Currently most devices capable of hi-res displays are mobile devices, such as new iPhones or iPads. However, since they are "mobile" in nature and their data may be relying on cell towers, even if the device has a hi-res display, users with slow connectivity probably do not want to wait a long time while images download. In these cases, foresight.js does a quick network speed test to make sure the user's device can handle hi-res images. Additionally, it stores the devices network connection speed information for 30 minutes (or any customizable to any expiration period you'd like) so it does not continually perform speed tests. You can host your own speed test file to be downloaded, or you can use the default URI available for public use found in the foresight configuration.



## Src Modification
An _img src_ attribute needs to be modified so the browser can request the correct image according to the device and network speed. How an image's src is formatted is entirely up to the URI format of the server, but foresight.js allows the _img src_ attribute to be customized to meet various formats.

Src modification types can be assigned in the _foresight.options.srcModification_ config, or individually for each image using the _img data-src-modification_ attribute. The possible values are __replaceDimensions__ or __rebuildSrc__ and described below.

__replaceDimensions__: The current src may already have dimensions within the URI. Instead of rebuilding the src entirely, just find and replace the original dimensions with the new dimensions. 

__rebuildSrc__: Rebuild the src by parsing apart the current URI and rebuilding it using the supplied _src format_. Review the Src Format section to see how to format the image URI's.


## Src Format
The src format is only required when using the _rebuildSrc_ src modification. The src format provides foresight with how the request image should be built. Each server's image request is different and the _srcFormat_ value allows the URI to be customized. The format can either be in the _foresight.options.srcFormat_ config, or individually for each image using the _img data-src-format_ attribute. Below are the various keys which are used to rebuild the src to request the correct image from the server. Each one is not required, and you should only use the keys which help build the src request for the server.

__{protocol}__: The protocol of the request. ie: _http_ or _https_

__{host}__: The host. ie: _cdn.mysite.com_ or _www.wikipedia.com_

__{port}__: The port number, but production systems will rarely use this. ie: _80_

__{directory}__: The directory (folder) within the path. ie: _/images/_

__{file}__: Includes both the file-name and file-extension of the image. ie: _myimage.jpg_

__{filename}__: Only the file-name of the image. ie: _myimage_

__{ext}__: Only the file-extension of the image. ie: _jpg_

__{query}__: The querystring. ie: _page=1&size=10_

__{requestWidth}__: The requested width of the image to load. This value will automatically be calculated, it's just that you need to tell foresight.js where to put the request width in the src. ie: _320_

__{requestHeight}__: The requested height of the image to load. This value will automatically be calculated, it's just that you need to tell foresight.js where to put the request height in the src. ie: _480_

__{pixelRatio}__: The requested pixel ratio of the image to load. This value will automatically be calculated, its just that you need to tell foresight.js where to put this info in the src. ie: _2_

_Again, not all of these keys are required inside your src URI. Src format is entirely dependent on how the server handles image requests. See [Server Resizing Images](//github.com/adamdbradley/foresight.js/wiki/Server-Resizing-Images) for more information on a few options for requesting various images sizes from a server._



#### Src Format Examples

    Example A: Width and height in their own folder:
    Output Src: http://cdn.mysite.com/images/640/480/myimage.jpg
    SrcFormat: {protocol}://{host}{directory}{requestWidth}/{requestHeight}/{file}

    Example B: Width and height in the querystring
    Output Src: http://cdn.mysite.com/images/myimage.jpg?w=640&h=480
    SrcFormat: {protocol}://{host}{directory}{file}?w={requestWidth}&h={requestHeight}

    Example C: Width in the filename, request to the same host
    Output Src: /images/320px-myimage.jpg
    SrcFormat: {directory}{requestWidth}px-{file}

    Example D: Pixel ratio in the filename
    Output Src: http://images.example.com/home/images/hero_2x.jpg
    SrcFormat: {protocol}://{host}{directory}{file}_{pixelRatio}x.jpg

    Example E: Width in the filename, actual Wikipedia.org src format
    Output Src: http://upload.wikimedia.org/wikipedia/commons/thumb/5/57/AmericanBadger.JPG/1024px-AmericanBadger.JPG
    SrcFormat: {protocol}://{host}{directory}{requestWidth}px-{file}



## Foresight Options
Foresight comes with default settings, but using the _foresight.options_ object allows you to customize them as needed. The easiest way to configure foresight.js is to include the _foresight.options_ configuration before the foresight.js script, such as:

    <script>
        foresight = {
            options: {
                srcModification: 'rebuildSrc',
                srcFormat: '{directory}{requestWidth}px-{file}'
            }
        };
    </script>
    <script src="foresight.js"></script>

__foresight.options.srcModification__: Which type of src modification to use, either _rebuildSrc_ or _replaceDimensions_. See the Src Modification section for more info.

__foresight.options.srcFormat__: The format in which a src should be rebuilt. See the Src Format section for more info.

__foresight.options.testConn__: Boolean value determining if foresight should test the network connection speed or not. Default is _true_

__foresight.options.minKbpsForHighSpeedConn__: Foresight considers a network connection to be either high-speed or not. When a device has a high-speed connection and hi-res display it will request hi-res images to be downloaded. However, everyone's interpretation of what is considered _high-speed_ should be a variable. By default, any connection that can download an image at a minimum of 800Kbps is considered high-speed. The value should be a number representing Kbps. Default value is _800_

__foresight.options.speedTestUri__: You can determine the URI for the speed test image. By default it will use a foresight hosted image, but you can always choose your own URI for the test image. Default value is _//foresightjs.appspot.com/speed-test/100K_

__foresight.options.speedTestKB__: Foresight needs to know the filesize of the speed test file is so it can calculate the approximate network connection speed. By default it downloads a 100KB file. The value should be a number representing KiloBytes. Default value is _100_

__foresight.options.speedTestExpireMinutes__: Speed-tests do not need to be continually performed on every page. Instead you can set how often a speed test should be completed, and in between tests you can rely on past test information. The value should be a number representing how many minutes a speed test is valid until it expires. Default value is _30_

__foresight.options.maxImgWidth__: A max pixel width can be set on images. This is in reference to browser, or CSS, pixels. Default value is _1200_

__foresight.options.maxImgHeight__: A max pixel height can be set on images. This is in reference to browser, or CSS, pixels. Default value is _1200_

__foresight.options.maxImgRequestWidth__: A max pixel request width can be set on how large of images can be requested from the server. Default value is _2048_

__foresight.options.maxImgRequestHeight__: A max pixel request height can be set on how large of images can be requested from the server. Default value is _2048_

__foresight.options.forcedPixelRatio__: You can override the device pixel ratio value. Default value is _undefined_ 

Additionally, the _foresight.options_ configurations can be overridden by each individual _img_ element if need be. See the Img Attributes section for more information on individual configuration.



## Img Attributes
__data-src__: _(Required)_ The src attribute of the image, which is the location image on the server. Note that the img element should not set the _src_ attribute, but instead it sets a _data-src_ attribute.

__width__: _(Required)_ The pixel width according to the browser. Any adjusting to the device pixel ratio will be taken care of and request image automatically adjusted. Both _width_ and _height_ are required so we can always proportionally scale the image.

__height__: _(Required)_ The pixel height according to the browser. Any adjusting to the device pixel ratio will be taken care of and request image automatically adjusted. Both _width_ and _height_ are required so we can always proportionally scale the image.

__data-src-modification__: _(Optional)_ Which type of src modification to use, either _rebuildSrc_ or _replaceDimensions_. See the Src Modification section for more info.

__data-src-format__: _(Optional)_ The format in which a src should be rebuilt. See the Src Format section for more info.

__data-max-width__: _(Optional)_ Maximum browser, or CSS, pixel width this image should take. If this value is greater than the width it will scale the image proportionally.

__data-max-height__: _(Optional)_ Maximum browser, or CSS, pixel height this image should take. If this value is greater than the height it will scale the image proportionally.

__data-pixel-ratio__: _(Optional)_ By default an image's pixel ratio is figured out using the devices pixel ratio. You can however manually assign an image's pixel ratio which will override the default.



## Foresight Properties

After foresight executes there are a handful of properties viewable.

__foresight.images__: An array containing each of the foresight _img_ elements.

__foresight.devicePixelRatio__: The device's pixel ratio used by foresight. If the browser does not know the pixel ratio, which older browsers will not know, the devicePixelRatio__ defaults to 1.

__foresight.connTestMethod__: The connection test value provides info on how the device received its speed-test information. 

* _network_: The speed test information came directly from a network test.
* _networkSlow_: A 100KB file should be downloaded within 1 second on a 800Kbps connection. If the speed test takes longer than 1 second than we already know its not a high-speed connection. Instead of waiting for the response, just continue and set that this network connection is not a high-speed connection.
* _networkError_: When a speed-test network error occurs, such as a 404 response, the connTestMethod will equal networkError and will not be considered a high-speed connection.
* _localStorage_: A speed-test does not need to be executed on every webpage. The browser's localStorage function is used to remember the last speed test information. When the last speed-test falls outside of the _foresight.options.speedTestExpireMinutes_ option it execute a new speed-test again.
* _skip_: If the device pixel ratio equals 1 then the display cannot view hi-res images. Since high-resolution doesn't apply to this device, foresight doesn't bother testing the network connection.

__foresight.connKbps__: Number representing the estimated Kbps following a network connection speed-test. This value can also come from localStorage if the last test was within the _foresight.options.speedTestExpireMinutes_ option.

__foresight.isHighSpeedConn__: Boolean used to tell foresight if this device's connection is considered a high-speed connection or not. You can use the _foresight.options.minKbpsForHighSpeedConn_ configuration option to help determine what is considered _high-speed_. See the minKbpsForHighSpeedConn config description for more info.



## Foresight Events

__foresight.oncomplete__: Executed after foresight rebuilds each of the image src's.



## Foresight Debugging
Instead of including debugging code directly in the foresight.js, an additional javascript file has been included to help developers debug. By using the _foresight.oncomplete_ event and populated _foresight_ properties, the _foresight-debug.js_ file prints out relevant information to help debug. This is particularly useful for mobile devices since it is more difficult to view source code and javascript errors. Below is an example on how to include the _foresight-debugger.js_ file and calling it when foresight completes:

    <script src="foresight-debugger.js"></script>
    <script>
        foresight = {
            options: {
                srcModification: 'rebuildSrc',
                srcFormat: '{directory}{requestWidth}px-{file}'
            },
            oncomplete: foresight_debugger
        };
    </script>
    <script src="foresight.js"></script>