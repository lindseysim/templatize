import {RootNode, TextNode, PartialNode, SectionNode} from "./nodes.js";
import {TYPES, typeOf, evalf, formatValue}            from "./misc.js";
import DIRECTIVES                                     from "./directives.js";
import Template                                       from "./template.js";
import Domain                                         from "./domain.js";

const DEFAULT = {
    errorOnFuncFailure: false, 
    evalZeroAsTrue:     false, 
    escapeAll:          false, 
    errorOnMissingTags: false
};

class Interface {

    constructor(template, options) {
        options = options || {};
        this._errorOnFuncFailure = options.errorOnFuncFailure || DEFAULT.errorOnFuncFailure;
        this._evalZeroAsTrue     = options.evalZeroAsTrue || DEFAULT.evalZeroAsTrue;
        this._escapeAll          = options.escapeAll || DEFAULT.escapeAll;
        this._errorOnMissingTags = options.errorOnMissingTags || DEFAULT.errorOnMissingTags;
        this._template           = template;
        // this._bindings           = null;
        this._root               = null;
        this._partials           = {};
        this._options            = {};
        this._errorHandler       = null;
    }

    get errorOnFuncFailure()   { return this._errorOnFuncFailure; }
    get evalZeroAsTrue()       { return this._evalZeroAsTrue; }
    get escapeAll()            { return this._escapeAll; }
    get errorOnMissingTags()   { return this._errorOnMissingTags; }
    set errorOnFuncFailure(to) { if(typeof to !== "undefined") this._errorOnFuncFailure = Boolean(to); }
    set evalZeroAsTrue(to)     { if(typeof to !== "undefined") this._evalZeroAsTrue = Boolean(to); }
    set escapeAll(to)          { if(typeof to !== "undefined") this._escapeAll = Boolean(to); }
    set errorOnMissingTags(to) { if(typeof to !== "undefined") this._errorOnMissingTags = Boolean(to); }

    _missingHandler(key, throwError) {
        if(throwError || this._errorOnMissingTags) {
            throw `Render error: missing binding for '${key}'`;
        };
        return "";
    }

    render(bindings, options) {
        options = options || {};
        if(options.errorOnFuncFailure !== undefined) this.errorOnFuncFailure = options.errorOnFuncFailure;
        if(options.evalZeroAsTrue !== undefined)     this.evalZeroAsTrue     = options.evalZeroAsTrue;
        if(options.escapeAll !== undefined)          this.escapeAll          = options.escapeAll;
        if(options.handleMissingTags !== undefined)  this.handleMissingTags  = options.handleMissingTags;
        this._errorHandler = (function(throwError) {
            return function(key) {
                return function(exception) {
                    if(throwError) throw exception;
                    console.error(`Error evaluating bindings at ${key}`);
                    console.error(exception);
                    return "";
                };
            };
        })(this._errorOnFuncFailure);
        try {
            // snapshot options
            this._options = {
                errorOnFuncFailure: this.errorOnFuncFailure, 
                evalZeroAsTrue:     this.evalZeroAsTrue, 
                escapeAll:          this.escapeAll, 
                handleMissingTags:  this.handleMissingTags
            };
            if(bindings instanceof Domain) {
                // partials get passed context object, don't need to recreate
                this._root = bindings;
            } else {
                this._root = new Domain(bindings);
            }
            // map partials
            this._partials = options.partials || {};
            for(let pkey in this._partials) {
                if(typeof this._partials[pkey] === "string") {
                    try {
                        this._partials[pkey] = new Template(this._partials[pkey]);
                    } catch(e) {
                        console.error(`Invalid partial template for '${pkey}'`);
                        throw e;
                    }
                } else if(!(this._partials[pkey] instanceof Template)) {
                    throw `Invalid partial: must be instance of Template or template string ('${pkey}' is ${typeof this._partials[pkey]})`;
                }
            }
            // first round should process all but repeating sections and partials
            // second round will process all repeating sections and partials
            return this._render2(this._render1(this._template.root));
        } finally {
            // clean up references and temporary variables
            if(this._root) this._root.cleanup();
            this._root     = null;
            this._partials = {};
            this._options  = {};
        }
    }

    _context(node, domain, lastDomain) {
        // in-context directive in unresolved, dynamic domchain can't be resolved yet
        if(lastDomain && node.incontext && lastDomain.isdynamic) return null;
        // get domain of node
        let onFuncError = this._errorHandler(node.raw), 
            result = {node: domain.search(node, onFuncError)};
        if(!result.node) return null;
        // can't resolve if resulting node's domain is dynamic (exception for lists and section evaluation)
        if(result.node.isdynamic && !(node instanceof SectionNode) && node.directive !== DIRECTIVES.LIST) {
            return null;
        }
        if(node.func) {
            // get domain of function
            result.func = domain.search(node.func, onFuncError);
            if(!result.func) throw `Context passed to unresolved function at ${node.raw}`;
            if(!result.func.function) throw `Context passed to non-function at ${node.raw}`;
            result.value = () => evalf(result.func.function, result.node.value(onFuncError), onFuncError);
        } else {
            result.value = () => result.node.value(onFuncError);
        }
        return result;
    }

    _render1(root, domain, processed, lastDomain) {
        domain = domain || this._root;
        processed = processed || new RootNode();
        var node, context;
        for(let n = 0; n < root.inner.length; ++n) {
            node = root.inner[n];
            // skip comments (shouldn't exist but just in case)
            if(node.directive === DIRECTIVES.COMMENT) continue;
            // text doesn't need processing
            if(node instanceof TextNode) {
                processed.inner.push(node);
                continue;
            }
            // render partial as sub-render with passed data domain and duplicate options
            if(node instanceof PartialNode) {
                processed.inner.push(this._partial(node, domain));
                continue;
            }
            // get data context (note stop before full-resolve if dynamic domain)
            // handle in-context nodes as domain is set to last valid context, not necessarily the actual
            context = this._context(node, domain, lastDomain);
            // if null, possibly due to nesting into dynamic data context, so defer till 2nd round
            if(!context) {
                processed.inner.push(node);
                continue;
            }
            // sections are recursed into if shown, skipped if hidden (dynamic data domains for sections do 
            // get handled now)
            if(node instanceof SectionNode) {
                this._section(node, domain, context, processed);
                continue;
            }
            // render straight values unless it depends on dynamic context (those defer till 2nd round)
            processed.inner.push(this._renderValue(node, context.value()));
        }
        return processed;
    }

    _render2(root, domain) {
        // goal here is to handle repeating sections from inside out to reduce redundancy
        domain = domain || this._root;
        var node, context, 
            processed = new RootNode();
        for(let n = 0; n < root.inner.length; ++n) {
            node = root.inner[n];
            // only handle sections for this first outside-in loop
            if(!(node instanceof SectionNode)) {
                processed.inner.push(node);
                continue;
            }
            // get binding for section
            context = this._context(node, domain);
            if(!context) {
                // missing here is either skip or exception thrown
                this._missingHandler(node.raw);
            } else if(context.node.isdynamic) {
                if(context.func) {
                    // additional step to process through function first
                    context = context.node.dynamic.create(context.func.fullkey, context.value());
                } else {
                    context = context.node;
                }
                let dylen = context.dynamic.length(), 
                    dydom;
                for(let i = 0; i < dylen; ++i) {
                    // get dynamic domain and recurse into section
                    dydom = context.dynamic.get(i);
                    if(this._display(true, dydom, true)) {
                        processed.inner.push(this._render2(node, dydom));
                    }
                }
            } else if(this._display(node.inclusive, context.node)) {
                // standard section within a dynamic data domain
                 processed.inner.push(this._render2(node, context.node));
            }
        }
        // this part will run from inner-most out on all remaining nodes
        var text = "";
        for(let n = 0; n < processed.inner.length; ++n) {
            node = processed.inner[n];
            if(node instanceof TextNode) {
                text += node.text;
            } else if(typeof node === "string") {
                text += node;
            } else {
                context = this._context(node, domain);
                if(!context) {
                    this._missingHandler(node.raw);
                } else {
                    text += this._renderValue(node, context.value());
                }
            }
        }
        return text;
    }

    _section(node, domain, context, processed) {
        if(context.node.isdynamic) {
            if(node.inclusive && context.node.dynamic.length()) {
                // copy and recurse to process any tags referencing non-dynamic data
                var dynode = new SectionNode(node);
                // replace any context shortcuts with full path as it will be handled later out of context
                if(dynode.incontext) {
                    dynode.key = context.node.fullkey;
                    dynode.incontext = false;
                    dynode._finish();
                }
                if(dynode.func && dynode.func.incontext) {
                    dynode.func.key = context.func.fullkey;
                    dynode.func.incontext = false;
                    dynode.func._finish();
                }
                this._render1(node, domain, dynode, context.node);
                // add copied section node for 2nd round of processing for dynamic data references
                processed.inner.push(dynode);
            }
            return;
        }
        // standard sections
        if(this._display(node.inclusive, context)) {
            // if section is context passed to function, have to treat as dynamic data domain
            if(context.func) {
                context = context.node.dynamic.create(context.func.fullkey, context.value());
            } else {
                context = context.node;
            }
            this._render1(node, context, processed, context);
        }
    }

    _display(inclusive, context) {
        let display = context.value();
        switch(context.type) {
            case TYPES.OBJECT:
                let _display = context.get("_display");
                if(_display) return _display.value();
                break;
            case TYPES.ARRAY:
                if(context.func) {
                    // context passed to function may return array, treat as standard section but warn
                    display = display.length;
                    console.warn(
                        `Section evaluation in context passed to function results in array at ${node.raw}. \n` + 
                        "Will be treated as standard section. For repeating sections, must explicitly supply an array value."
                    );
                }
                break;
            default:
                switch(typeof display) {
                    case "string":
                        display = display.trim();
                        break;
                    case "number":
                        if(!display && display === 0) {
                            display = this._evalZeroAsTrue;
                        }
                        break;
                }
                break;
        }
        return Boolean(inclusive) === Boolean(display);
    }

    _partial(node, context) {
        if(!this._partials[node.key]) {
            switch(this._handleMissingTags) {
                case "throw":
                case "error":
                    throw `Render error: missing partial for ${node.key}`;
                default:
                    console.warn(`Render error: missing partial for ${node.key}`)
                    return "";
            }
        }
        try {
            return this._partials[node.key].render(
                node.incontext ? context : this._root, 
                this._options
            );
        } catch(e) {
            console.log(`Partial render error for '${node.raw}'`);
            console.warn(e);
            return "";
        }
    }

    _renderValue(node, value) {
        let format = node.format, 
            type   = typeOf(value);
        if(type <= TYPES.NULL) return "";
        // format list (unless not array, then normal handling)
        if(node.directive === DIRECTIVES.LIST && type === TYPES.ARRAY) {
            value = value.map(vi => {
                // multi-dimensional arrays simply converted to string
                if(Array.isArray(vi)) return `[${vi.toString()}]`;
                return formatValue(vi, format, node.escape || this._escapeAll);
            });
            switch(value.length) {
                case 0:
                    return "";
                case 1:
                    return value[0];
                case 2:
                    return `${value[0]} and ${value[1]}`;
                default:
                    let last = value.pop();
                    return value.join(", ") + `, and ${last}`;
            }
        }
        // any other non-value type, convert to string
        if(type !== TYPES.VALUE) {
            value = `[${value.toString()}]`;
            format = false;
        }
        // final format and add
        return formatValue(value, format, node.escape || this._escapeAll);
    }

    _mergeText(input, out) {
        out = out || new RootNode();
        var text = "", node;
        for(let n = 0; n < input.inner.length; ++n) {
            node = input.inner[n];
            if(node instanceof TextNode) {
                text += node.text;
            } else {
                out.inner.push(new TextNode(text), node);
                text = "";
            }
        }
        if(text) out.inner.push(new TextNode(text));
        return out;
    }

};

export default Interface;