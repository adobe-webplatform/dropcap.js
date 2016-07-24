/*
Copyright 2014 Adobe Systems Incorporated. Licensed under the Apache 2.0 License.
http://www.apache.org/licenses/LICENSE-2.0.html
*/

(function() {
"use strict";

// Reference terms: http://blogs.wayne.edu/bcam/wp-content/blogs.dir/308/files/2013/09/glyphterms.gif
 
var TEST_GLYPH = "X";
var TEST_SIZE = 100;
var TEST_SIZE_PX = TEST_SIZE + "px";
var ZEROPX = "0px";
var LINEHEIGHT_DEFAULT = 1.15; // Blink fallback

var _fontMetricsCache = {};

function getLineMetrics(css) {
    var fontSize = parseFloat(css.fontSize);
    var lineHeight = (css.lineHeight==='normal')?(LINEHEIGHT_DEFAULT*fontSize):parseFloat(css.lineHeight);

    return {
        leading: (lineHeight - fontSize),
        lineHeight: lineHeight,
        fontSize: fontSize
    };
}

function createTestContainingBlock(document) {
    var div = document.createElement('div');
   
    div.style.position = "fixed"; // To make containing block and out of flow
    div.style.padding = ZEROPX;
    div.style.opacity = "0";      // So we don't see it; we need to be attached to the current doc to get layout info. Can't be display:none either
    div.style.fontSize = TEST_SIZE_PX;
    div.style.lineHeight = "1"; 
    
    document.body.appendChild(div);
    return div;
}

function newTestGlyph(container) {
    var span = container.ownerDocument.createElement('span');
    span.textContent = TEST_GLYPH;
    if (container) {
        container.appendChild(span);
    }
    return span;
}

function destroyTestContainingBlock(element) {
    element.ownerDocument.body.removeChild(element);
}

function measureCapHeightRatio(testParent, fontFamily, width, height) {
    // We use canvas to figure out the ratio of cap-height to overall font height.
    // This helps us figure out the factor by which to grow our drop cap's font
    // size to fill the entire drop cap float.
    //
    // Because some browsers may not position the baseline at the same height in 
    // canvas vs HTML we will detect both the cap line and the baseline using a 
    // capital 'E'

    var ratio = -1;
    var canvas = document.createElement('canvas');
    canvas.width = width; 
    canvas.height = height;
    testParent.appendChild(canvas); 
    
    var ctx = canvas.getContext('2d');
    ctx.font = TEST_SIZE_PX +" "+fontFamily;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";
    ctx.fillText('E',0,0);

    // Grab the central column of pixels
    var middleYline = ctx.getImageData(Math.ceil(canvas.width/2), 0, 1, canvas.height);
    var bottomL = null;

    function _isBlack(imageData, pxIndex) {
        var firstByte = pxIndex*4;
        var red = imageData.data[firstByte];
        var green = imageData.data[firstByte + 1];
        var blue = imageData.data[firstByte + 2];

        return (red===0 || green===0 || blue===0)?true:false;
    }

    // From the bottom, go up until we fnd the first black pixel
    for (var y = canvas.height-1; y >= 0; y--) {
        if (_isBlack(middleYline, y)) {
            bottomL = y;
            break;
        }
    }

    // From the top, go down until the first black pixel
    for (var y = 0; y < canvas.height; y++) {
        if (_isBlack(middleYline, y)) {
            ratio = (bottomL + 1 - y)/height;
            break;
        }
    }

    return ratio;
}

function getFontMetrics(document, fontFamily) {
    var ret = _fontMetricsCache[fontFamily];
    if (ret) {
        return ret;
    }

    ret = { baselineRatio: undefined, capHeightRatio: undefined };
   
    /*
        The injected markup looks like:

        <p style="position:fixed; padding:0; opacity:0; line-height:1; font-size: 100px; font-family:...;">
            <span style="font-size:0px">X</span>
            <span>X</span>
        </p>
    */

    var testBlock = createTestContainingBlock(document);
    testBlock.style.fontFamily = fontFamily; 
    
    var zeroX = newTestGlyph(testBlock);
    zeroX.style.fontSize = ZEROPX;
    var largeX = newTestGlyph(testBlock);
  
    ret.baselineRatio = zeroX.offsetTop/TEST_SIZE;
    try {   
        ret.capHeightRatio = measureCapHeightRatio(testBlock, fontFamily, largeX.offsetWidth, TEST_SIZE);
    } catch(e) {
        throw new Error('[dropcap.js] Error computing font metrics: '+ e.message);
    } finally {
        destroyTestContainingBlock(testBlock);
    }

    _fontMetricsCache[fontFamily] = ret;

    return ret;
}

var DCJS_DESCENDER_CLASS = "dcjs-descender";

function toPxLength(pxNumber) {
    return pxNumber + "px";
}

function hasDescenderClass(dcapElement) {
    // Note: classList not supported in IE9
    if (dcapElement.classList.contains(DCJS_DESCENDER_CLASS)) {
        return true;
    }
}

function isDescenderChar(dcapElement) {
    var descenders = "gjpqQ";

    if (descenders.indexOf(dcapElement.textContent) === -1) {
        return false;
    }
    return true;
}

function resetDropcapStyle(element) {
    if (element.dcapjs) {
        element.style.cssFloat = "";
        element.style.padding = "";
        element.style.fontSize = "";
        element.style.lineHeight = "";
        element.style.marginTop = "";
    }
}

function layoutDropcap(dropcapElement, heightInLines, baselinePos) {
        if (!baselinePos) {
            baselinePos = heightInLines;
        }

        if(baselinePos==1 && heightInLines==1) {
            // First baseline and one-line tall? Reset any dropcap.js
            // styling and let the browser lay it out
            resetDropcapStyle(dropcapElement);
            return;
        }

        var doc = dropcapElement.ownerDocument;
        var dcap = dropcapElement;
        var par = dcap.parentNode;
        var dcapCSS = window.getComputedStyle(dcap);
        var parCSS = window.getComputedStyle(par);

        // Compute all our metrics
        var dcapFontMetrics = getFontMetrics(doc, dcapCSS.fontFamily);
        var parFontMetrics = getFontMetrics(doc, parCSS.fontFamily);
        var dcapCapHeightRatio = dcapFontMetrics.capHeightRatio;
        var parLineMetrics = getLineMetrics(parCSS);

        // We compute size and position for the main use-case: the drop cap 
        // extend from the baseline of the nth line to the cap line of the 
        // first line. Then adjust as needed if heightInLines != baslinePos
        //
        // For the height, we take the line height of all n lines then substract:
        // 1. The half-leading for the first and nth line 
        // 2. The space below the baseline of the nth line
        // 3. The space between the ascender line and the cap line 

        var ascend = (parFontMetrics.baselineRatio - parFontMetrics.capHeightRatio)*parLineMetrics.fontSize;
      
        var dcapHeightInPx = (heightInLines*parLineMetrics.lineHeight) - parLineMetrics.leading - ascend - ((1-parFontMetrics.baselineRatio)*parLineMetrics.fontSize);
        var dcapFontSizeInPx = (dcapHeightInPx/dcapCapHeightRatio); 
      
        dcap.dcapjs = true;
        if (dcapCSS.direction=='rtl') {
          dcap.style.cssFloat = "right";
        }
        else {
          dcap.style.cssFloat = "left";
        }
        dcap.style.padding = ZEROPX;
        dcap.style.fontSize = toPxLength(dcapFontSizeInPx);  
        dcap.style.lineHeight = ZEROPX;

        // Push the float down by the first line's half-leading + the space between 
        // cap line and ascender line
        var verticalOffset = parLineMetrics.leading/2 + ascend; 
        // If the dropcap is raised by n lines, we need to drag it up accordingly
        // (or down is it's sized down...)
        verticalOffset -= ((heightInLines - baselinePos)*parLineMetrics.lineHeight);
        dcap.style.marginTop = toPxLength(verticalOffset);

        // Is the drop cap raised? Adjust its parent paragraph's top margin by the
        // height of the rise
        if (heightInLines > baselinePos) {
            var parMarginTop = parseFloat(parCSS.marginTop);
            par.style.marginTop = toPxLength(parMarginTop + (-1*verticalOffset));
        } 

        // Is it a descender? Make our float taller
        var descendAdjust = 0;

        if (isDescenderChar(dcap)) {
            // Can we tell the dropcap has a descender?
            // Estimate the amount of space below the baseline
            descendAdjust = dcapFontSizeInPx*(1-dcapFontMetrics.baselineRatio);
        } else if (hasDescenderClass(dcap)) {
            // Did the author tell us to treat this dropcap as a descender?
            // Then make the float font-size high
            // Note: the result may generally be too tall; experience will show
            // whether this is useful
            descendAdjust = dcapFontSizeInPx - dcapHeightInPx;
        } 

        dcap.style.height = toPxLength(dcapHeightInPx + descendAdjust);
        
        
        // The baseline of an empty inline-block is its bottom
        // margin edge. Because the dropcap span is a float, it
        // creates a BFC preventing such an inline-block to 'bleed' 
        // outside its boundary like an anonymous inline glyph can. 
        // The inline block we create below acts a strut that pulls 
        // the baseline of the dropcap element's anymous glyph down 
        //to the bottom of the span
        var strut = dcap.dcapjsStrut;
        if (!strut) {
            strut=doc.createElement("span");
            strut.style.display = "inline-block";
            dcap.appendChild(strut);
            dcap.dcapjsStrut = strut;
        }
        strut.style.height = toPxLength(dcapHeightInPx);
        
}

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

})();