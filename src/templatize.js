import * as d3 from "d3-format";

if(!String.prototype.endsWith) {
    String.prototype.endsWith = function(search, this_len) {
        if(this_len === undefined || this_len > this.length) this_len = this.length;
        return this.substring(this_len - search.length, this_len) === search;
    };
}

export default {
    // flag for throwing error on function evaluation
    errorOnFuncFailure: false, 
    // for testing object type (only way to find base obj)
    __objTester: ({}).toString, 

    render: function(html, bindings, cleanup) {
        var rendered = this.__render(html, bindings)
                           .replace(new RegExp(`(?<!!){{![^}]*}}` , 'g'), "");  // cleanup comments
        if(cleanup) {
            var iCleanupStart = rendered.indexOf("{{");
            while(~iCleanupStart) {
                // ignore escaped
                if(iCleanupStart > 0 && rendered[iCleanupStart-1] === "!") {
                    iCleanupStart = rendered.indexOf("{{", iCleanupStart+2);
                } else {
                    let iCleanupEnd = rendered.indexOf("}}", iCleanupStart);
                    if(!~iCleanupEnd) break;
                    rendered = rendered.slice(0, iCleanupStart) + rendered.slice(iCleanupEnd+2);
                    iCleanupStart = rendered.indexOf("{{");
                }
            }
        }
        return rendered;
    }, 

    __render: function(html, bindings, prefix) {
        if(!html) return "";
        // render section for subsections as nested objects
        let inSection = false;
        if(prefix !== null && prefix !== undefined) {
            inSection = true;
            let display = !("_display" in bindings) || bindings["_display"];
            html = this.__renderSection(html, prefix, display);
        }
        // prep prefix for next level
        let usePrefix = inSection ? prefix + "." : "";
        for(let key in bindings) {
            // skip reserved values
            if(key === "_display" || key === "_parent") continue;
            let tKey = usePrefix + key, 
                value = bindings[key];
            // special cases
            if(value) {
                switch(this.__objTester.call(value)) {
                    // if an object literal, recurse into
                    case "[object Object]":
                        if(!value._parent) value._parent = bindings;  // add parent context
                        html = this.__render(html, value, tKey);
                        delete value._parent;
                        continue;
                    // if an array, treat as repeating section
                    case "[object Array]":
                        if(!value._parent) value._parent = bindings;  // add parent context
                        html = this.__renderList(html, tKey, value);
                        html = this.__renderRepeatingSection(html, tKey, value);
                        delete value._parent;
                        continue;
                    // if a function, use it to evaluate value, then recurse to apply by result type
                    case "[object Function]":
                        try {
                            // duplicate function result as if it were in binding
                            let rebind = {};
                            rebind[key] = value.call(bindings);
                            if(!rebind._parent) rebind._parent = bindings;  // add parent context
                            html = this.__render(html, rebind, prefix);
                            continue;
                        } catch(e) {
                            if(this.errorOnFuncFailure) throw e;
                            value = "";
                        }
                }
            }
            // display/hide section with this tag first
            html = this.__renderSection(html, tKey, value);
            html = this.__renderValue(html, tKey, value);
        }
        return html;
    }, 

    __renderSection: function(html, section, display) {
        // value that evaluate to false but treated as true is 0, vice versa for whitespace-only string
        display = display === 0 || (display && (typeof display !== "string" || display.trim().length));
            // section tags
        var sectionIncludeStart = `{{#${section}}}`, 
            sectionExcludeStart = `{{^${section}}}`, 
            sectionEnd          = `{{/${section}}}`, 
            // to optimize not searching over parts already passed or when string isn't long enough anyways
            searchFromIndex     = 0, 
            minHtmlLength       = sectionIncludeStart.length + sectionEnd.length;
        while(true) {
            // break length isn't even long enough for section tags to fit or at end of template
            if(html.length < minHtmlLength || (searchFromIndex && searchFromIndex+1 >= html.length)) break;
            // find first section of either type
            let iIncludeStart = this.__indexOf(html, sectionIncludeStart, searchFromIndex), 
                iExcludeStart = this.__indexOf(html, sectionExcludeStart, searchFromIndex), 
                // determine which type is found first
                inclusive     = ~iIncludeStart && (!~iExcludeStart || iIncludeStart < iExcludeStart), 
                iStart        = inclusive ? iIncludeStart : iExcludeStart;
            // if valid, find section end, search from found section start
            let iEnd = ~iStart ? this.__indexOf(html, sectionEnd, iStart) : false;
            if(iEnd === false || !~iEnd) break;
            // break if no [properly-formatted] section found
            if(!~iEnd) break;
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

    __renderRepeatingSection: function(html, section, bindings) {
        let sectionStart = `{{#${section}}}`, 
            sectionEnd   = `{{/${section}}}`, 
            iStart       = this.__indexOf(html, sectionStart), 
            iEnd         = ~iStart ? this.__indexOf(html, sectionEnd, iStart) : -1;
        if(!~iEnd) return html;
        // slice out section html
        let sectionHtml = html.substring(iStart + sectionStart.length, iEnd), 
            insertHtml = "";
        // build HTML for repeating sections
        for(let i = 0; i < bindings.length; ++i) {
            if(this.__objTester.call(bindings[i]) === "[object Object]") {
                // if an object literal, treat like a new render
                if(!("_display" in bindings[i]) || bindings[i]["_display"]) {
                    bindings[i]._parent = bindings._parent;  // add parent context
                    insertHtml += this.__render(sectionHtml, bindings[i], section);
                    delete bindings[i]._parent;
                }
            } else {
                // try to print value as is
                insertHtml += this.__renderValue(sectionHtml, `${section}.`, bindings[i]);
            }
        }
        // splice into full template, replacing old section template
        if(iStart === 0) {
            html = insertHtml + html.slice(iEnd + sectionEnd.length);
        } else {
            html = html.slice(0, iStart) + insertHtml + html.slice(iEnd + sectionEnd.length);
        }
        // repeat until no more sections found
        return this.__renderRepeatingSection(html, section, bindings);
    }, 

    __renderList: function(html, section, bindings) {
        let listStr = false;
        return html.replace(new RegExp(`(?<!!){{(&${section})(?:::)?([^:}]*)?}}` , 'g'), (match, tag, format) => {
            if(listStr !== false) return listStr;
            if(!bindings || !bindings.length) return listStr = "";
            let values = bindings.map(val => this.__format(val, format));
            if(values.length === 1) {
                listStr = values[0];
            } else if(values.length === 2) {
                listStr = `${values[0]} and ${values[1]}`;
            } else {
                listStr = "";
                values.forEach((item, i) => {
                    listStr += `${i ? ", " : ""}${i+1 === values.length ? "and " : ""}${item}`;
                });
            }
            return listStr;
        });
    }, 

    __indexOf: function(html, search, indexStart) {
        let index = html.indexOf(search, indexStart || 0);
        while(index > 0 && html[index-1] === "!") {
            index = html.indexOf(search, index+search.length);
        }
        return index;
    }, 

    __renderValue: function(html, tag, value) {
       return html.replace(new RegExp(`(?<!!){{(${tag})(?:::)?([^:}]*)?}}` , 'g'), (match, tag, format) => {
            return this.__format(value, format);
        });
    }, 

    __format: function(value, format) {
        if(!format) return value;
        if(!isNaN(value) && !isNaN(parseFloat(value))) {
            return d3.format(format)(value);
        }
        if(format.startsWith("^")) {
            value = this.__escape(value);
            format = format.substr(1);
        }
        switch(format) {
            case "encode":
                return value.toString().replace(/&/g, "&amp;")
                     .replace(/</g, "&lt;")
                     .replace(/>/g, "&gt;")
                     .replace(/"/g, "&quot;")
                     .replace(/'/g, "&#039;");
            case "upper":
                return value.toString().toUpperCase();
            case "lower":
                return value.toString().toLowerCase();
            case "capitalize":
                return value.toString().replace(/(?:^|[^\w])[a-z]/g, match => {
                    return match === "'s" ? match : match.toUpperCase();
                });
        }
        return value;
    }, 

    __escape(value) {
        return value.toString().replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

};