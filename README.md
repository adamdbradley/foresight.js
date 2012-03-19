#### Introduction
The __foresight.js__ gives webpages the ability to see if the user's device is capable of viewing high-resolution displays (such as the 3rd generation iPad), and if the device currently has a fast enough network connection. Depending on display and network connectivity, __foresight.js__ will request the appropriate image. 

This project's overall goal is to solve these current issues faced by web developers: [Challenges for High-Resolution Images](//github.com/adamdbradley/foresight.js/wiki/Challenges-for-High-Resolution-Images)

#### Features
* Request hi-res images according to device pixel ratio
* Detect network connection speed
* Javascript Framework independent (ie: jQuery not required)
* Customizable through configuration options
* Does not make multiple requests for the same image
* Default images load without javascript enabled

#### Quick Start Guide

1. Include the _foresight.js_ in the _head_ element of the webpage.