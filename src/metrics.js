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
