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
