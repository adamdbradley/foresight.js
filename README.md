## Introduction
__Foresight.js__ gives webpages the ability to tell if the user's device is capable of viewing high-resolution images (such as the 3rd generation iPad) before the image has been requested from the server. Additionally, it judges if the user's device currently has a fast enough network connection for high-resolution images. Depending on device display and network connectivity, __foresight.js__ will request the appropriate image for the webpage. By customizing the _img_ _src_ attribute using methods such as URI templates, it is able to form requests built for your image's resolution variants. Media queries however could be used when dealing with CSS background-images, while foresight.js is used to handle inline _img_ elements (or until current web standards are improved).

Foresight.js has made significant improvements over its previous versions, specifically the implenentation of the image-set() function. The latest version lets the browser control the image's browser dimensions completely, while foresight.js only worries about which image to request according to the network connection and device pixel ratio. Additionally, previously foresight.js was centered around requesting dynamically sized images, and while this is still possible, it also ensures its easy to request static based images (such as images with "@2x" or "-highres" in the filename).

This project's overall goal is to tackle these current issues faced by web developers designing for hi-res: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images). Foresight.js aims at providing a lightweight, cross-browser and framework independent tool for a high-resolution web. Please feel free to contact me ([@adamdbradley](https://twitter.com/adamdbradley)) or contribute to this project to help improve it. 



## Features
* Request hi-res images according to device pixel ratio
* Estimates network connection speed prior to requesting an image
* Allows existing CSS techniques to control an image's dimensions within the browser
* Implements image-set() to control which image resolution variant to request
* Does not make multiple requests for the same image
* Javascript library and framework independent (ie: jQuery not required)
* Image dimensions set by percents will scale to the parent element's available width
* Default images will load without javascript enabled
* Does not use device detection through user-agents
* Minifies down to roughly 7K


## Demos
Before we get too far into the nitty-gritty, it's probably best to view foresight.js in action. Currently most desktop and laptops do not have high-resolution displays and are limited to a device pixel ratio of only 1, so you will not be able to see the effects on a standard monitor. Make sure you view the demos from multiple devices, such as your mobile phone, tablet and traditional .

* [Foresight.js Demos](http://foresightjs.appspot.com/css-demos/index.html)


## Img Element
One of the largest problems faced with dynamically deciding image quality is that by the time javascript is capable of viewing an _img_ in the DOM, the image file has already been requested from the server. And on the flip side, if _img_ elements are built by javascript then search engines probably won't view them and browsers without javascript enabled will also not be able to view the images. To overcome both of these challenges foresight.js uses the _img_ element, but without the _src_ attribute set, and a _noscript_ element with a child _img_ element.

    <img data-src="imagefile.jpg" data-width="320" data-height="240" class="fs-img">
    <noscript>
        <img src="imagefile.jpg">
    </noscript>

Notice how the first image is missing the _src_ attribute, but instead has a _data-src_ attribute. Because this _img_ element does not have the _src_ attribute the browser will not attempt to download the file. Once the DOM is ready, foresight.js does its magic to transform the _data-src_ and set the _src_ attribute tailored to the device's display and network connectivity. Using this structure allows us to still place _img_ elements within the context of the webpage, while also allowing search engines and javascript disabled browsers to view the images. 

One concept change is that both the _data-width_ and _data-height_ attributes should not be seen as the image's physical dimensions, but rather a way for the browser to know the image's aspect ratio as it is scaled up and down according to the desired dimensions and device pixel ratio. Foresight.js decides the image's actual dimensions, while the _data-width_ and _data-height_ attributes help to maintain its correct aspect ratio.

Until the web community completes a new standard to hi-res context images, and it becomes widely adopted by all the major browsers, and the updated browsers are installed on the billions of devices in the world, the approach by foresight.js is one of the few that answers each of the [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images). 

_There is hope however as the web community continues to work on a solution for high-resolution images. These resources offer a glimpse about what's currently being worked on (and be sure to read the comments too) [Adaptive Image Element](https://gist.github.com/2159117), [Polyfilling picture without the overhead](http://www.w3.org/community/respimg/2012/03/15/polyfilling-picture-without-the-overhead/) and [The image-set() function (for responsive images)](http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html).



## CSS: Using image-set() to control image requests

The first version of foresight.js was a proof-of-concept configured using javascript options and HTML attributes. While it showed potential, there was still an area for improvement is to allow many of its features to be controlled with CSS. Its no secret presentation should be separated from functionality.

The largest introduction is the use of the _image-set()_ CSS function. The [image-set() function (for responsive images)](http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html) thread offers some great insight and direction that responsive images may be heading. 

From [image-set() function (for responsive images)](http://lists.w3.org/Archives/Public/www-style/2012Feb/1103.html):

> I'd like to propose a new function for the Images module. This function will allow developers to provide, in a compact manner, multiple variants of the same image at differing resolutions. Using @media pushes the two asset references apart from one another, whereas such a function keeps related asset references together. It also helps keep selectors DRY. We've called it image-set(), and it takes one or more image specifiers.

Here is an example of a proposed format:

    image-set( url(foo.png) 1x low-bandwidth, url(foo@2x.png) 2x high-bandwidth )

Like they pointed out, the image-set() function is great because it keeps everything together and might just be a huge piece of the hi-res puzzle. But obviously this new concept is a ways away from being standardized and widely adopted across the worlds browsers.

The latest version of foresight.js is combining its original idea from the first version, by using URI templates, and following the _image-set()_ concept. This way you can use just one, or any number of CSS rules to control images throughout your site instead of creating a CSS rule for every image. _Check out the URI Templates section farther down for more info._

The big hang-up at the moment would be that most browsers have no clue what _image-set()_ is, and since any custom CSS property isn't valid then the DOM is unable to view the newly introduced image-set() CSS. 

#### Enter _font-family_!

"FONT FAMILY! YOU NUTS!" Yes, but hang with me. An _img_ element doesn't use the _font-family_ property because you're not exactly assigning "Times New Roman" to your funny cat pictures, so its already useless to the _img_ element. Secondly,  _font-family_ is one of the few properties which lets you enter free-text in the value and the browsers still consider it valid and viewable by the DOM (yup, even IE doesn't care). 

In the example below you'll see we're using the _font-family_ property to hold the _image-set_ value. Foresight's javascript is then able to view your CSS, whether its in an external stylesheet, internal styles within the _head_ element, or even inline styles, and request the appropriate image given the browser's circumstances. The example is simply telling the browser, "if your device pixel ratio is 1, or you have low-bandwidth, then request the foo.png image. If your device pixel ratio is 2, and you have high-bandwidth, then request the foo@2x.png image."

    <style>
        .fs-img {
            font-family: ' image-set( url(/images/foo.png) 1x low-bandwidth, url(/images/foo@2x.png) 2x high-bandwidth ) ';
        }
    </style>

This is good, except now my CSS class _fs-img_ only lets me request the foo.png and foo@2x.png images, and we'd rather not create a CSS rule for each image we want to request (and I know you may be hung up on the font-family property, but until a better idea comes around its a workable solution for all browsers).

Now let's take this one step further and allow each image-set url to have its own URI template, such as:

    <style>
        .fs-img {
            font-family: ' image-set( url({directory}{filename}.{ext}) 1x low-bandwidth, url({directory}{filename}@2x.{ext}) 2x high-bandwidth ) ';
        }
    </style>

This time we're not specifically coding the _foo.png_ file, or even files in the _/images/_ directory. Instead we're simply stating, "hey browser, if this image should be low-res, then use the first URI template. If this image should be hi-res, then use the second URI template."

Each URI template can be fully customized to your website's image request format. In the example above, any images which have the _fs-img_ CSS classname assigned will use the following URI templates, but foresight.js chooses which template to use depending on your device pixel ratio and network connection speed. Being that the image-set() value is just CSS and can be applied like any other CSS property your options are wide open. If you review the demos you'll see that _image-set()_ actually gives you many options. 


## NoScript Element
Immediately you'll notice that the _noscript_ element and its child _img_ is redundant, but with today's standards this is one of the issues we'll have to dance with. _However, if your website has no reason to care about SEO or support browsers without javascript than feel free to omit the noscript elements and display:none CSS all together._

If javascript is not enabled then the browser shows the _noscript_ _img_ instead. In this case the webpage should also hide the foresight.js _img_ so it's not seen as a broken image. The CSS rule applied to foresight.js images should contain the _display:none_ CSS property, such as:

    <style> 
    	.fs-img {
            font-family: ' image-set( url({directory}{filename}.{ext}) 1x low-bandwidth, url({directory}{filename}@2x.{ext}) 2x high-bandwidth ) ';
    	    display:none;
    	}
    </style>
    
    ...
    
    <img data-src="/images/imagefile.jpg" data-width="320" data-height="240" class="fs-img">
    <noscript>
        <img src="/images/imagefile.jpg">
    </noscript>
    
When foresight.js executes, it will change each image's display style to 'inline' so it can be seen.



## High-Speed Network Connection Test
Currently most devices capable of hi-res displays are mobile devices, such as new iPhones or iPads. However, since they are "mobile" in nature and their data may be relying on cell towers, even if the device has a hi-res display, users with slow connectivity probably do not want to wait a long time while images download. In these cases, foresight.js does a quick network speed test to make sure the user's device can handle hi-res images. Additionally, it stores the devices network connection speed information for 30 minutes (or is customizable to any expiration period you'd like) so it does not continually perform speed tests. You can host your own speed test file to be downloaded, or you can use the default URI available for public use found in the foresight.js configuration.

Other speed test notes:

* If the response takes longer than it "should" take to download the test file, then foresight.js will no longer wait on the test response and automatically consider the connection "slow"
* If the device has a pixel ratio of _1_, then the display in unable to view hi-res anyways. In these cases (which is just about all traditional computers at the moment), it doesn't bother with doing a speed test because it already knows its a waste of time since the display can't view hi-res.
* If the device implements _navigator.connection.type_, and the known connection type is either _2g_ or _3g_, then it doesn't bother doing the speed test since it already knows its too slow. _Android is currently seems to be the only one implementing navigator.connection.type, and even then it may not always have the info (but when it does it'll save us time, and for 2g that's pretty valuable info).
* Foresight's publically available speed test file is hosted by Google App Engine, which is a cloud-based service and can handle many requests. Additionally, if the page requesting the speed test is SSL, foresight.js will ensure the speed test image is downloaded using the _https://_ protocol.



## Src Modification
An _img src_ attribute needs to be modified so the browser can request the correct image according to the device and network speed. How an image's src is formatted is entirely up to the URI format of the server, but foresight.js allows the _img src_ attribute to be customized to meet various formats.

Src modification can be applied using three different methods:

__src-replace-dimensions__: The current src may already have dimensions within the URI. Instead of rebuilding the src entirely, just find and replace the original dimensions with the new dimensions. This is also the default method because even if you do not have dimensions within the src it'll still return the default image you supplied.

__src-uri-template__: Rebuild the src by parsing apart the current URI and rebuilding it using the supplied _URI template_. Review the Src URI Template section to see how to format the image URI's.

__src-hi-res__: The _data-src-high-resolution_ attribute can be used to identify which _src_ to use when the device is hi-res ready. See the definition under the Img Attributes section to read more about manually setting which file to use when the hi-res image should be shown instead. The first two Src Modification type should be used when dynamically building the img src, while the _data-src-high-resolution_ attribute is used if you want to manually tell foresight.js which image to use when hi-res is enabled.



## URI Template
The src URI template provides foresight.js with how the request should be built for the image. Each server's image request is different and the URI template can be customized to meet each server's format. Below are the various format keys that are used to rebuild the src to request the correct image from the server. Each one is not required, and you should only use the format keys that help build the src request for the server. 

__{protocol}__: The protocol of the request. ie: _http_ or _https_

__{host}__: The host. ie: _cdn.mysite.com_ or _www.wikipedia.com_

__{port}__: The port number, but production systems will rarely use this. ie: _80_

__{directory}__: The directory (folder) within the path. ie: _/images/_

__{file}__: Includes both the file-name and file-extension of the image. ie: _myimage.jpg_

__{filename}__: Only the file-name of the image. ie: _myimage_

__{ext}__: Only the file-extension of the image. ie: _jpg_

__{query}__: The querystring. ie: _page=1&size=10_

__{scaleFactor}__: The scale factor for the image to load. This value will automatically be calculated, it's just that you may need to tell foresight.js where to put this info within the src. ie: _2_

__{requestWidth}__: The natural width of the image to load. This value will automatically be calculated, it's just that you may need to tell foresight.js where to put the natural width within the src. ie: _320_

__{requestHeight}__: The natural height of the image to load. This value will automatically be calculated, it's just that you need to tell foresight.js where to put the natural height within the src. ie: _480_

__{src}__: The original src value. Use this if you do not want to make any changes to the src from the one already supplied in the _data-src_ attribute. This would be used mostly for the 1x scale factors and low-bandwidth image-sets, mainly stating that the default image should be requested instead of modifying the src. ie: _http://cdn.mysite.com/images/foo.png_

_Again, not all of these keys are required inside your template. URI template is entirely dependent on how the server handles image requests. See [Server Resizing Images](//github.com/adamdbradley/foresight.js/wiki/Server-Resizing-Images) for more information on a few options for requesting various images sizes from a server._



#### Src URI Template Examples

    Example A: Custom terms within the URI
    Original Src:     /images/funnycat.jpg
    Uri Template:     {directory}{filename}-hi-res.{ext}
    Request Src:      /images/funnycat-hi-res.jpg

    Example B: Scale factor in the filename
    Original Src:     http://images.example.com/home/images/hero.jpg
    Uri Template:     {protocol}://{host}{directory}{file}@{scaleFactor}x.jpg
    Request Src:      http://images.example.com/home/images/hero_2x.jpg

    Example C: Width and height in their own directory
    Original Src:     http://cdn.mysite.com/images/myimage.jpg
    Uri Template:     {protocol}://{host}{directory}{requestWidth}x{requestHeight}/{file}
    Request Src:      http://cdn.mysite.com/images/640x480/myimage.jpg

    Example D: Width and height in the querystring
    Original Src:     http://cdn.mysite.com/images/myimage.jpg
    Uri Template:     {protocol}://{host}{directory}{file}?w={requestWidth}&h={requestHeight}
    Request Src:      http://cdn.mysite.com/images/myimage.jpg?w=640&h=480

    Example E: Width in the filename, request to the same host
    Original Src:     /images/myimage.jpg
    Uri Template:     {directory}{requestWidth}px-{file}
    Request Src:      /images/320px-myimage.jpg



## Foresight.js Options
Foresight.js comes with default settings, but using _foresight.options_ allows you to customize them as needed. The easiest way to configure foresight.js is to include the _foresight.options_ configuration before the foresight.js script, such as:

    <script>
        foresight = {
            options: {
                minKbpsForHighBandwidth: 800,
                speedTestExpireMinutes: 60
            }
        };
    </script>
    <script src="foresight.js"></script>

__foresight.options.testConn__: Boolean value determining if foresight.js should test the network connection speed or not. Default is _true_

__foresight.options.minKbpsForHighBandwidth__: Foresight.js considers a network connection to be either high-speed or not. When a device has a high-speed connection and hi-res display it will request hi-res images to be downloaded. However, everyone's interpretation of what is considered _high-speed_ should be a variable. By default, any connection that can download an image at a minimum of 400Kbps is considered high-speed. The value should be a number representing Kbps. Default value is _400_

__foresight.options.speedTestUri__: You can determine the URI for the speed test image. By default it will use a foresight.js hosted image, but you can always choose your own URI for the test image. Default value is _http://foresightjs.appspot.com/speed-test/50K.jpg (also note that if the webpage is in SSL, foresight.js will replace 'http:' for 'https:' to avoid any ugly security warnings)_

__foresight.options.speedTestKB__: Foresight.js needs to know the filesize of the speed test file is so it can calculate the approximate network connection speed. By default it downloads a 50KB file. The value should be a number representing KiloBytes. Default value is _50_

__foresight.options.speedTestExpireMinutes__: Speed-tests do not need to be continually performed on every page. Instead you can set how often a speed test should be completed, and in between tests you can rely on past test information. The value should be a number representing how many minutes a speed test is valid until it expires. Default value is _30_

__foresight.options.forcedPixelRatio__: You can override the device pixel ratio value. This is used more so for debugging purposes. Default value is _undefined_ 

__foresight.options.forcedBandwidth__: You can override what the network bandwidth is with either _low_ or _high_ values. This is used more so for debugging purposes. Default value is _undefined_ 



## Img Attributes
__data-src__: _(Required)_ The src attribute of the image, which is the location image on the server. Note that the img element should not set the _src_ attribute, but instead it sets a _data-src_ attribute.

__data-width__: _(Required)_ The pixel width according to the browser. Any adjustments to the device pixel ratio will take care of the request image width automatically. Both _data-width_ and _data-height_ are required so we can always proportionally scale the image.

__data-height__: _(Required)_ The pixel height according to the browser. Any adjustments to the device pixel ratio will take care of the request image height automatically. Both _data-width_ and _data-height_ are required so we can always proportionally scale the image.

__data-src-high-resolution__: _(Optional)_ Alternatively to dynamically building the img's _src_, you can manually set the _data-src-high-resolution_ attribute which is used when the device is high-resolution enabled. Any device pixel ratio greater than 1 is considered high-resolution. For example, devices with a pixel ratio of 1.5 and 2 will both receive the same image.



## Foresight.js Properties

After foresight.js executes there are a handful of properties viewable.

__foresight.images__: An array containing each of the foresight.js _img_ elements.

__foresight.devicePixelRatio__: The device's pixel ratio used by foresight. If the browser does not know the pixel ratio, which older browsers will not, the _devicePixelRatio_ defaults to 1.

__foresight.connType__: The connection type used by the device, such as 2g, 3g, 4g, eternet, wifi, etc. Current only some Android devices seem to support _navigator.connection.type_. But for the devices that do support this, and they state that they are using either a 2g or 3g connection, foresight.js doesn't even bother doing a speed test. See [W3C Network Information API](http://www.w3.org/TR/netinfo-api/) for more info.

__foresight.connTestResult__: The connection test result provides info on how the device received its speed-test information. Below are the possible values:

* _networkSuccess_: The speed test information came directly from a network test.
* _networkSlow_: A 50KB file should be downloaded within 1 second on a 400Kbps connection. If the speed test takes longer than 1 second than we already know its not a high-speed connection. Instead of waiting for the response, just continue and set that this network connection is not a high-speed connection.
* _networkError_: When a speed-test network error occurs, such as a 404 response, the connTestMethod will equal networkError and will not be considered a high-speed connection.
* _networkAbort_: When a speed-test network abort occurs,  the connTestMethod will equal networkAbort and will not be considered a high-speed connection.
* _connTypeSlow_: The device stated that it is using either a 2g or 3g connection, which in this case we do not perform a speed test and just consider this device to not have a high-speed connection.
* _localStorage_: A speed-test does not need to be executed on every webpage. The browser's localStorage function is used to remember the last speed test information. When the last speed-test falls outside of the _foresight.options.speedTestExpireMinutes_ option it execute a new speed-test again.
* _skip_: If the device pixel ratio equals 1 then the display cannot view hi-res images. Since high-resolution doesn't apply to this device, foresight.js doesn't bother testing the network connection.

__foresight.connKbps__: Number representing the estimated Kbps following a network connection speed-test. This value can also come from localStorage if the last test was within the _foresight.options.speedTestExpireMinutes_ option. Note that _foresight.connKbps_ is not an extremely accurate assessment of the device's connection speed, but rather provides a fast look to see if it can download a file quickly (and then remembers that test info for a configurable number of minutes). 

__foresight.bandwidth__: String value which is either _low_ or _high_ and used to tell foresight.js if this device's bandwidth is low-bandwidth or high-bandwidth. You can use the _foresight.options.minKbpsForHighBandwidth_ configuration option to help determine what is considered _high-bandwidth_. See the minKbpsForHighBandwidth config description for more info.



## Foresight.js Methods
__foresight.reload__: Call this method when your code changes the DOM. However, _foresight.reload_ is automatically executed on any window resize event. Take a look at the jQuery Mobile integration and the demos on an example of how it would be used.



## jQuery Mobile Integration
Foresight.js does not require the jQuery library or jQuery Mobile framework, but it can still be easily integrated into jQuery Mobile. Below is a sample of what the head element would contain so foresight.js can be used:

    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
    <script src="http://code.jquery.com/mobile/1.0.1/jquery.mobile-1.0.1.min.js"></script>
    <script src="foresight.js"></script>
    <script>
        $(document).bind("pagechange", foresight.reload);
    </script>

Notice how it binds the _foresight.reload_ method when a page change happens, this ensures all new images to the DOM are correctly loaded by foresight. Take a look at the [jQuery Mobile demo pages](http://foresightjs.appspot.com/demos/jquery-mobile-page-1.html) to see it in action.


## Foresight.js Events

__foresight.updateComplete__: Executed after foresight.js rebuilds each of the image src's.



## Foresight.js Debugging
Instead of including debugging code directly in the foresight.js, an additional javascript file has been included to help developers debug. By using the _foresight.updateComplete_ event and populated _foresight_ properties, the _foresight-debug.js_ file prints out relevant information to help debug. This is particularly useful for mobile devices since it is more difficult to view source code and javascript errors. Below is an example on how to include the _foresight-debugger.js_ file and calling it when foresight.js completes:

    <script>
        foresight = {
            options: {
                minKbpsForHighBandwidth: 800,
                speedTestExpireMinutes: 60
            }
        };
    </script>
    <script src="foresight-debugger.js"></script>
    <script src="foresight.js"></script>
    


## Testing

Foresight's goal has always been to work on the major browsers, both desktop and mobile, and not require any javascript libraries or frameworks. If you come across any problems please help us by submitting an issue and we'll work to improve it. Below are the primary browsers foresight.js has been tested against.

* iOS 5.1 (iPad3 & iPhone4)
* Android 2.3 (Samsung Charge)
* Chrome 17 (Mac)
* Chrome 19 (Win)
* Safari 5.1 (Mac)
* Firefox 11 (Mac)
* Firefox 10 (Win)
* IE8


## Contribute

This project was originally created as a need for an ecommerce mobile homepage, which basically showed high-resolution images for high-resolution devices, and adjust image widths accordingly. This is by no means the end-all solution for high-resolution images; I'd label this more as an interim solution as the web standards evolve for handling device pixel ratios. Please feel free to improve this project in any way you can.

__Contact Me__

* [@adamdbradley](https://twitter.com/adamdbradley)



## License

Copyright (c) 2012 Adam Bradley

Licensed under the MIT license.

