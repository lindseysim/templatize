import Helpers from "./helpers.js"


const Interface = function(options) {
    options = options || {};

    this.__delimiters = options.delimiters || ["{{","}}"];
    // flag for throwing error on function evaluation
    this.errorOnFuncFailure = options.errorOnFuncFailure || false;
    // flag for treating 0 as true for section evaluation
    this.evalZeroAsTrue = options.evalZeroAsTrue || false;

    if(!Array.isArray(this.__delimiters) || this.__delimiters.length < 2) {
        throw "Invalid delimiters supplied";
    } else {
        this.__delimiters = this.__delimiters.map(d => d.trim());
    }

    this.render = function(html, bindings, cleanup) {
        this.__data = {
            template: html, 
            root:     bindings
        };
        try {
            var rendered = this.__render(this.__data.template, bindings, null);
            rendered = this.__renderValue(rendered, undefined, "", "!");  // cleanup comments
            if(cleanup) rendered = this.__renderValue(rendered, undefined, "");  // cleanup orphaned tags
            return rendered;
        } finally {
            this.__data = null;
        }
    };

    this.__render = function(html, bindings, prefix) {
        if(!html) return "";
        // render section for subsections as nested objects
        let inSection = false;
        if(prefix !== null && prefix !== undefined) {
            inSection = true;
            let display = !("_display" in bindings) || bindings["_display"];
            html = this.__renderSection(html, prefix, display);
        }
        // prep prefix for next level
        let usePrefix = inSection ? prefix + "." : "", 
            value, path;
        for(let key in bindings) {
            // skip reserved values
            if(key === "_display" || key === "_parent") continue;
            value = bindings[key];
            key = key.trim();        // strip leading/trailing whitespace
            path = usePrefix + key;  // full key path from root
            // special cases
            if(value) {
                // if an array, treat as repeating section
                if(Array.isArray(value)) {
                    html = this.__renderList(html, path, value, bindings),  // list formatting
                    html = this.__renderRepeatingSection(html, path, value, bindings);
                    continue;
                }
                switch(typeof value) {
                    case "function":
                        try {
                            // skip naked evaluation if marked as contextual only
                            if(key.startsWith("~")) continue;
                            // duplicate function result into emulated binding
                            let rebind = {};
                            rebind[path] = value.call(bindings);
                            if(!rebind._parent) rebind._parent = bindings;
                            // recurse to apply by result type
                            html = this.__render(html, rebind, null);
                            continue;
                        } catch(e) {
                            // set error if functions errors, otherwise continue with blank to remove tags
                            if(this.errorOnFuncFailure) throw e;
                            console.error(e);
                            value = "";
                            break;
                        }
                    case "object":
                        if(!value._parent) value._parent = bindings;  // add parent context
                        // check to render as function context
                        html = this.__renderFunctionContext(html, path, value);
                        // recurse into
                        html = this.__render(html, value, path);
                        delete value._parent;
                        break;
                }
            }
            // display/hide section (after having checked for repeating)
            html = this.__renderSection(html, path, value);
            // render simple tags
            html = this.__renderValue(html, path, value);
        }
        return html;
    };

    this.__renderValue = function(html, tag, value, as) {
        let opts = {
                split: ["::"], 
                as: as || false
            }, 
            find = Helpers.findTag(html, this.__delimiters, tag, opts);
        while(find) {
            let format = find.directives.length ? find.directives[0] : false, 
                fvalue = Helpers.format(value, format);
            html = html.slice(0, find.start) + fvalue + html.slice(find.end);
            opts.search = find.start + fvalue.length;
            find = Helpers.findTag(html, this.__delimiters, tag, opts);
        }
        return html;
    };

    this.__renderList = function(html, tag, bindings, context) {
        let opts = {
                split: ["::"], 
                as: "&"
            }, 
            find = Helpers.findTag(html, this.__delimiters, tag, opts);
        while(find) {
            let format = find.directives.length ? find.directives[0] : false, 
                values = bindings.map(val => {
                    if(Array.isArray(val)) throw `Multi-dimensional arrays not supported (for: ${tag})`;
                    // if function try to evaluate, but must eventually return object or primitive
                    let b = 0;
                    while(typeof val === "function" && ++b <= 20) {
                        val = val.call(context);
                    }
                    if(typeof val === "object") throw `List items cannot be objects (for: ${tag})`;
                    return Helpers.format(val, format);
                });
            let listStr;
            switch(values.length) {
                case 1:
                    listStr = values[0];
                    break;
                case 2:
                    listStr = `${values[0]} and ${values[1]}`;
                    break;
                default:
                    listStr = "";
                    values.forEach((item, i) => {
                        listStr += `${i ? ", " : ""}${i+1 === values.length ? "and " : ""}${item}`;
                    });
            }
            html = html.slice(0, find.start) + listStr + html.slice(find.end);
            opts.search = find.start + listStr.length;
            find = Helpers.findTag(html, this.__delimiters, tag, opts);
        }
        return html;
    };

    this.__renderSectionAbstract = function(html, tag, as, render) {
        let section, rendered, options = {
            search: 0, 
            as: as
        };
        while(true) {
            section = Helpers.findSection(html, this.__delimiters, tag, options);
            if(!section) break;
            rendered = render(section);
            html = html.slice(0, section.open.start) + rendered + html.slice(section.close.end);
            options.search = section.open.start + rendered.length;
        }
        return html;
    };

    this.__renderSection = function(html, tag, display) {
        display = (
            (this.evalZeroAsTrue && display === 0)  // if set to, evaluate strict 0 as true
            || (display && (typeof display !== "string" || display.trim().length))  // only-whitespace is false
        );
        // render sections from outermost-in (until non-display hit)
        function render(section) {
            if(section.as === "#" ? !display : display) return "";
            let pieces = [section.inner[0]];
            section.nest.forEach((child, i) => {
                pieces.push(render(child), section.inner[i+1]);
            });
            return pieces.join("");
        }
        return this.__renderSectionAbstract(html, tag, ["#", "^"], render);
    };

    this.__renderRepeatingSection = function(html, tag, bindings, context) {
        // build and render sections from inside-out
        let render = section => {
            let template = section.inner[0];
            section.nest.forEach((child, i) => {
                template += render(child) + section.inner[i+1];
            });
            let rendered = "";
            bindings.forEach(item => {
                if(Array.isArray(item)) throw `Multi-dimensional arrays not supported (for: ${tag})`;
                // if function try to evaluate, but must eventually return object or primitive
                let b = 0;
                while(typeof item === "function" && ++b <= 20) {
                    item = item.call(context);
                }
                let itemRendered;
                switch(typeof item) {
                    case "object":
                        // if an object literal, treat like a new render
                        if("_display" in item && !item._display) break;
                        item._parent = context;
                        itemRendered = this.__renderFunctionContext(template, tag, item);
                        itemRendered = this.__render(itemRendered, item, tag);
                        delete item._parent;
                        break;
                    default:
                        // try to print value as is for flat values in array
                        itemRendered = this.__renderValue(template, `${tag}.`, item);
                }
                rendered += itemRendered;
            });
            return rendered;
        }
        return this.__renderSectionAbstract(html, tag, "#", render);
    };

    this.__renderFunctionContext = function(html, tag, context) {
        let opts = {split: ["~", "::"]}, 
            find = Helpers.findTag(html, this.__delimiters, tag, opts), 
            value, 
            directives;
        while(find) {
            value = "";
            directives = find.directives;
            // must have at least the one split directive for function call
            if(directives.length) {
                let funcPath = find.directives[0], 
                    format = find.directives.length > 1 ? find.directives[1] : false;
                try {
                    // search for function from root
                    let path = funcPath.split("."), 
                        func = this.__data.root;
                    path.forEach((sub,i) => {
                        func = func[path[i]] || func["~"+path[i]];
                    });
                    value = Helpers.format(func.call(context), format);
                } catch(e) {
                    if(this.errorOnFuncFailure) throw e;
                    console.error(e);
                    value = "";
                }
                html = html.slice(0, find.start) + value + html.slice(find.end);
                opts.search = find.start + value.length;
            } else {
                opts.search = find.end;
            }
            find = Helpers.findTag(html, this.__delimiters, tag, opts);
        }
        return html;
    };

};

const Templatize = {};
Interface.call(Templatize);
Templatize.custom = options => {
    var inst = {};
    Interface.call(inst, options);
    return inst;
};

export default Templatize;