/*!
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


var CONTAINER_COLOR = "#8FD0F7";
var DEFAULT_BASELINEPOS = 4;
var DCAPCTLID_BASELINE = "dcap-baseline-pos";
var DCAPCTLID_HEIGHT = "dcap-height";

var controlHandlers = [
    { id: 'dcap-font', handlerType: 'val', onchange: onDropcapFont },
    { id:  DCAPCTLID_BASELINE, handlerType: 'val', onchange: onDropcapBaselinePos },
    { id:  DCAPCTLID_HEIGHT, handlerType: 'val', onchange: onDropcapHeight },
    { id: 'dcap-lock-height-to-pos', handlerType: 'check', onchange: onDropcapHeightLock }, 
    { id: 'dcap-show-float', handlerType: 'check', onchange: onDropcapShowFloat },
    { id: 'para-font', handlerType: 'val', onchange: onParaFont },
    { id: 'para-font-size', handlerType: 'val', onchange: onParaFontSize },
    { id: 'para-line-height', handlerType: 'val', onchange: onParaLineHeight },        
];

var dropcaps = ".test-dropcap";
var paragraphs = ".test-paragraph";
var dropcapNodes = document.querySelectorAll(dropcaps);

var styleSheet = document.styleSheets[0];
var dcRule = findRuleBySelector(styleSheet, dropcaps);
var parRule = findRuleBySelector(styleSheet, paragraphs);

var lockHeightToPos = true;
var dcBaselineCtl = document.getElementById(DCAPCTLID_BASELINE);
var dcHeightCtl = document.getElementById(DCAPCTLID_HEIGHT);
var dropcapHeightControl = document.getElementById('dcap-height');

setupControlHandlers();
refresh();


function findRuleBySelector(styleSheet, selectorText) {
    var cssRules = styleSheet.cssRules;
    for (var i=0; i < cssRules.length && (!dcRule || !parRule); i++) {
        var r = cssRules[i];
        if (r.selectorText === selectorText) {
            return r;
        }
    }    
}

function forEachControlHandler(func) {
    controlHandlers.forEach(func);
}

function setupControlHandlers() {
    var valSuffix = "-val";

    forEachControlHandler(function(h) {
        var e = document.getElementById(h.id);

        function _makeValueHandler(func) {
            return function(event) {
                func(event.target.value);
            }
        }

        function _makeCheckHandler(func) {
            return function(event) {
                func(event.target.checked);
            }
        }

        switch(h.handlerType) {
            case 'val':
            e.onchange = _makeValueHandler(h.onchange);
            break;

            case 'check':
            e.onchange = _makeCheckHandler(h.onchange);
            break;
        }
        //e.onchange = h.onchange;
        e.valDisplay = document.getElementById(h.id+valSuffix);
        h.e = e;
    });
}

function dcBaseline() {
    return parseInt(dcBaselineCtl.value,10);
}

function dcHeight() {
    return parseInt(dcHeightCtl.value, 10);
}

function onDropcapFont(val) {
    dcRule.style.fontFamily = val;
    refresh(dcBaseline(), dcHeight());
}

function onDropcapHeight(val) {
    newHeight = parseInt(val,10);
    if (lockHeightToPos) {
        dcBaselineCtl.value = val;
    } 

    resetParagraphMarginTops();
    refresh(dcBaseline(), newHeight);
}

function onDropcapBaselinePos(val) {
    baselinePos = parseInt(val, 10);

    resetParagraphMarginTops();
    refresh(baselinePos, dcHeight());
}

function onDropcapHeightLock(checked) {
    if (checked) {
        lockHeightToPos = true;
        dcBaselineCtl.disabled = true;
        dcBaselineCtl.value = dcHeightCtl.value; 
    } else {
        lockHeightToPos = false;
        dcBaselineCtl.disabled = false;
    }

    resetParagraphMarginTops();
    refresh(dcBaseline(), dcHeight());
}

function onDropcapShowFloat(checked) {
    if(checked) {
        dcRule.style.backgroundColor = CONTAINER_COLOR;
    } else {
        dcRule.style.backgroundColor = "";
    }
}

function onParaFont(val) {
    parRule.style.fontFamily = val;
    refresh(dcBaseline(), dcHeight());
}

function onParaFontSize(val) {
    parRule.style.fontSize = val + "px";
    refresh(dcBaseline(), dcHeight());
}

function onParaLineHeight(val) {
    parRule.style.lineHeight = val;
    refresh(dcBaseline(), dcHeight());
}

function resetParagraphMarginTops() {
    var paragraphs = document.querySelectorAll(paragraphs);
    for (var i=0; i < paragraphs.length; i++) {
        var p = paragraphs[i];
        p.style.marginTop = "";
    }
}

function refresh(baselinePos, height) {
    baselinePos = baselinePos || DEFAULT_BASELINEPOS;
    height = height || baselinePos;

    window.Dropcap.layout(dropcapNodes, height, baselinePos);
    forEachControlHandler(function(h) {
        if (h.e.valDisplay) {
            h.e.valDisplay.textContent = h.e.value;
        }
    });
 
}