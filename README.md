dropcap.js
===========

dropcap.js makes beautiful drop caps easy for the web. Try it out at [http://webplatform.adobe.com/dropcap.js/](http://webplatform.adobe.com/dropcap.js/)

## Why
Though drop caps are very common in magazines and books, they remain rare on the web. We believe this is because doing it right simply and reliably is too difficult. A simple CSS float:left on a ::first-letter pseudo-element is not enough, as this [tumblr][tumblr] shows. This [blog post][blog] explains some of the challenges of defining drop caps in CSS today.

The CSS Working Group is currently specifying a [new property for drop cap layout][initial-letter]. Until this makes it into all our favorite browsers we wanted to make it work with today's platform.

## Getting Started

Options for adding dropcap.js to your project:

* Install with [npm](https://npmjs.org): `npm install dropcap.js`
* Clone the repo: `git clone https://github.com/adobe-webplatform/dropcap.js.git` 

## Using dropcap.js

**First**, your drop cap letters need to be enclosed in an HTML element e.g.:

    <p>
        <span class="dropcap">T</span>HE Quick Brown Fox...
    </p>

This is required because the CSS Object Model does not expose write access to the styling of pseudo-elements like ::first-letter; until then, explicit markup is preferred in this version.

**Then**, once you have updated your markup, simply include the script in your page.
   
    <script src='./dropcap.min.js'></script>

The script defines the `window.Dropcap.layout` method; you call it like so:

    window.Dropcap.layout(dropcapRef, heightInLines, baselinePos);

For instance:

    <script src='./dropcap.min.js'></script>
    <script>
        // We retrieve our drop cap elements using a class selector...
        var dropcaps = document.querySelectorAll(".dropcap"); 
        // ...then give them a height of three lines. 
        // By default, the drop cap's baseline will also be the third paragraph line.
        window.Dropcap.layout(dropcaps, 3); 
    </script>

For a live example, see the [source code][site-page] of the our [project home page][project-home].
    
### Dropcap.layout(dropcapRef, heightInLines, baselinePos)

**dropcapRef**

The `dropcapRef` parameter may be one of:

* An individual HTMLElement object 
* A NodeList e.g. obtained from `querySelectorAll()` or a property such as `Node.childNodes` 

For instance:

		<script src='./dropcap.min.js'></script>
		<script>
			var dropcaps = document.querySelectorAll(".dropcap");
    		window.Dropcap.layout(dropcaps, 3);
    	</script>
		
 
The specified element(s) will be floated, sized and positioned based on the values you specify for `baselinePos` and `heightInLines`.

**heightInLines**

The `heightInLines` parameter must have a value of 1 or higher. It specifies the height of the drop cap as a number of lines of the adjoining paragraph. 

**baselinePos (optional)**

The `baselinePos` parameter is optional; when specified, its value should be 1 or higher. It defines which baseline of its parent element the drop cap's own baseline must align with. For instance, a value of 4 means 'align the drop cap's baseline with the baseline of the paragraph's fourth line'. By default, `baselinePos` is the same as `heightInLines`, which makes the drop cap extend from the baseline of the `baselinePos`-th line to the cap line of the first line. (This is the most common use-case). When `baselinePos` is smaller than `heightInLines`, the result is that of a 'raised cap' as the top of the drop cap will be a number of lines above the first line of the paragraph.

### The Dropcap.options object

The properties of the options object expose general runtime configuration features of dropcap.js.

**runEvenIfInitialLetterExists**

Default value: `true`

When this option is true, `Dropcap.layout` will run whether or not the browser supports the `initial-letter` property. When set to false, `Dropcap.layout` will first check for the presence of `initial-letter` in the CSSOM and abort if it is found. Prefixed variations are checked.


## Building dropcap.js

To edit and build your own version of dropcap.js, you will need [node][node], [npm][npm], and [grunt][grunt]. To build:

1. Clone the repository
2. Enter the src directory of the repo
3. Run `npm install`
4. Run `grunt build`

You should see a `dropcap.js` and `dropcap.min.js` in the repository's root.

## Testing dropcap.js

The test folder currently has one test. The ten-line-tests.html file has
several large initial letters hand-coded to look correct in Mac Firefox.
The test button will run `window.Dropcap.layout` on all of these initial
letters and measure the difference between the script output and the
hand-coded expected result. The differences are displayed in the console.
This test was used to confirm whether iterations on the library were
improving or degrading the result.

## Known Constraints & Limitations

* We recommend setting an explicit line-height value for your drop caps' parent element. At least one browser (Chrome) computes the property's initial value of 'normal' to 'normal' instead of a length. You will get the best results with a length value or a factor like 1.2.
* dropcap.js currently assumes western content. Other international conventions - e.g. drop words, or Asian script conventions - are not supported.
* The current logic assumes the drop cap element's content to be a single glyph. It will not fail with several but was tested for single-glyph use.
* Dynamic content updates or document resizing are not automatically handled. It is up to the application to call `window.Dropcap.layout` when necessary.
* Fonts are assumed to be loaded by the time dropcap.js computed the font-family property.
* The sizing and positioning of the drop cap are done using pixel lengths. A future update may use EMs.

## Browser Support

We tested dropcap.js on Windows (IE10+, Firefox, Chrome) and OSX (Firefox, Chrome, Safari).

## Feedback

Please let us know if you have any feedback. If you run into any problems, you can file a [new issue][new-issue]. You can also reach us [@adobeweb][twitter].


[tumblr]: http://dauwhe.tumblr.com/
[initial-letter]: http://dev.w3.org/csswg/css-inline/#DropInitial
[node]: http://nodejs.org
[npm]: http://www.npmjs.org
[grunt]: http://gruntjs.com
[blog]: http://blogs.adobe.com/webplatform/2014/10/02/drop-caps-are-beautiful/
[site-page]: https://github.com/adobe-webplatform/dropcap.js/blob/gh-pages/index.html
[project-home]: http://webplatform.adobe.com/dropcap.js/
[new-issue]: https://github.com/adobe-webplatform/dropcap.js/issues/new
[twitter]: http://twitter.com/adobeweb


