/*
Copyright 2014 Adobe Systems Inc.;
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

function getCSSPropertyName(property) {
    var _supportElement = (window.document.body)?window.document.body:document.createElement('div');
    function _supported(p) {
        return p in _supportElement.style;
    }

    // Check for unprefixed first...
    if (_supported(property)) {
        return property;
    }

    // ...then look for prefixed version...
    var prefix = ['-webkit-', '-moz-', '-ms-', '-o'];
    for (var i=0; i < prefix.length; i++) {
        var name = prefix[i]+property;
        if (_supported(name)) {
            return name;
        }
    }

    return null;
}

var global;
if (typeof window !== 'undefined') {
  global = window;
} else if (typeof exports !== 'undefined') {
  global = exports;
} else {
  global = this;
}
global.Dropcap = {

    options: {
        runEvenIfInitialLetterExists: true,
    },

    layout: function(dropcapRef, heightInLines, baselinePos) {
        if (this.options.runEvenIfInitialLetterExists == false) {
            var initialLetter = getCSSPropertyName('initial-letter');
            if (initialLetter) {
                return;
            }
        }

        if (heightInLines < 1 || (baselinePos && baselinePos < 1)) {
            throw new RangeError("Dropcap.layout expects the baseline position and height to be 1 or above");
        }

        if (dropcapRef instanceof HTMLElement) {
            layoutDropcap(dropcapRef, heightInLines, baselinePos);
        } else if (dropcapRef instanceof NodeList) {
            var forEach = Array.prototype.forEach;
            forEach.call(dropcapRef, function(dropcap) {
                layoutDropcap(dropcap, heightInLines, baselinePos);
            });
        } else {
            throw new TypeError("Dropcap.layout expects a single HTMLElement or a NodeList");
        }
    }
};
