!function(root, factory) {
    if(typeof module === "object" && module.exports) {
        module.exports = factory();
    } else if(typeof define === "function" && define.amd) {
        define(factory);
    } else {
        root.Templatize = factory();
    }
}(this, function() {
    return {
        errorOnFuncFailure: false,   // flag for throwing error on function evaluation
        __objTester: ({}).toString,  // for testing object type (only way to find base obj)
        render: function(html, bindings) {
            return this.__render(html, bindings);
        }, 
        __render: function(html, bindings, prefix) {
            if(!html) return "";
            var inSection = prefix !== null && prefix !== undefined;;
            // render section for subsections as nested objects
            if(inSection) {
                var display = !("_display" in bindings) || bindings["_display"];
                html = this.__renderSection(html, prefix, display);
            }
            // prep prefix for next level
            prefix = inSection ? prefix + "." : "";
            for(var key in bindings) {
                // skip reserved values
                if(key === "_display" || key === "_parent") continue;
                var value = bindings[key];
                if(value) {
                    // special cases
                    switch(this.__objTester.call(value)) {
                        // if an object literal, recurse into
                        case "[object Object]":
                            if(!value._parent) value._parent = bindings;  // add parent context
                            html = this.__render(html, value, prefix + key);
                            continue;
                        // if an array, treat as repeating section
                        case "[object Array]":
                            if(!value._parent) value._parent = bindings;  // add parent context
                            html = this.__renderRepeatingSection(html, key, value, prefix);
                            continue;
                        // if a function, use it to evaluate value
                        case "[object Function]":
                            try {
                                value = value.call(bindings);
                            } catch(e) {
                                if(this.errorOnFuncFailure) throw e;
                                value = "";
                            }
                    }
                }
                var tKey = prefix + key;                         // full key name, including subsections
                html = this.__renderSection(html, tKey, value);  // check display/hide as section
                html = html.replace(                             // replace with greedy search
                    new RegExp("{{" + tKey + "}}" , 'g'), 
                    value
                );
            }
            return html;
        }, 
        __renderSection: function(html, section, display) {
            // value that evaluate to false but treated as true is 0, vice versa for whitespace-only string
            display = display === 0 || (display && (typeof display !== "string" || display.trim().length));
                // section tags
            var sectionIncludeStart = "{{#" + section + "}}", 
                sectionExcludeStart = "{{^" + section + "}}", 
                sectionEnd          = "{{/" + section + "}}", 
                // to optimize not searching over parts already passed or when string isn't long enough anyways
                searchFromIndex     = 0, 
                minHtmlLength       = sectionIncludeStart.length + sectionEnd.length;
            while(true) {
                // break length isn't even long enough for section tags to fit or at end of template
                if(html.length < minHtmlLength || (searchFromIndex && searchFromIndex+1 >= html.length)) break;
                    // find first section of either type
                var iIncludeStart = html.indexOf(sectionIncludeStart, searchFromIndex), 
                    iExcludeStart = html.indexOf(sectionExcludeStart, searchFromIndex), 
                    // determine which type is found first
                    inclusive     = ~iIncludeStart && (!~iExcludeStart || iIncludeStart < iExcludeStart), 
                    iStart        = inclusive ? iIncludeStart : iExcludeStart, 
                    // if valid, find section end, search from found section start
                    iEnd          = ~iStart ? html.indexOf(sectionEnd, iStart) : false;
                // break if no [properly-formatted] section found
                if(iEnd === false || !~iEnd) break;
                // display if display and inclusive or not-display and exclusive
                if(display ? inclusive : !inclusive) {
                    // simply remove the tags to show section (use non-greedy replace)
                    html = (
                        html.slice(0, iStart)
                        + html.slice(iStart + sectionEnd.length, iEnd)
                        + html.slice(iEnd + sectionEnd.length)
                    );
                    searchFromIndex = iEnd - sectionEnd.length;
                } else {
                    // splice out the section
                    if(iStart === 0) {
                        html = html.slice(iEnd + sectionEnd.length);
                    } else {
                        html = html.slice(0, iStart) + html.slice(iEnd + sectionEnd.length);
                    }
                    searchFromIndex = iStart;
                }
            }
            return html;
        }, 
        __renderRepeatingSection: function(html, section, bindings, prefix) {
            prefix = prefix ? prefix + "." + section : section;
            var sectionStart = "{{#" + section + "}}", 
                sectionEnd   = "{{/" + section + "}}", 
                iStart       = html.indexOf(sectionStart), 
                iEnd         = ~iStart ? html.indexOf(sectionEnd, iStart) : false;
            // both parts must be found and in correct order
            if(iEnd === false || !~iEnd) return html;
            // slice out section html
            var sectionHtml = html.substring(iStart + sectionStart.length, iEnd);
            // build HTML for repeating sections
            var insertHtml = "";
            for(var i = 0; i < bindings.length; ++i) {
                // treat each section like a new render
                insertHtml += this.__render(sectionHtml, bindings[i], prefix);
            }
            // splice into full template, replacing old section template
            if(iStart === 0) {
                return insertHtml + html.slice(iEnd + sectionEnd.length);
            } else {
                return html.slice(0, iStart) + insertHtml + html.slice(iEnd + sectionEnd.length);
            }
        }
    };
});