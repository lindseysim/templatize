import {RootNode, TextNode, PartialNode, SectionNode} from "./nodes.js";
import {TYPES, typeOf, evalf, formatValue}            from "./misc.js";
import DIRECTIVES                                     from "./directives.js";
import Template                                       from "./template.js";
import Domain                                         from "./domain.js";
import Context                                        from "./context.js";

const DEFAULT = {
    errorOnFuncFailure: false, 
    evalZeroAsTrue:     false, 
    escapeAll:          false, 
    errorOnMissingTags: false
};

function loadPartials(given, delimiters) {
    if(!given) return {};
    var imported = {}, 
        options = delimiters && {delimiters: delimiters};
    for(let pkey in given) {
        if(typeof given[pkey] === "string") {
            try {
                imported[pkey] = new Template(given[pkey], options);
            } catch(e) {
                console.error(`Invalid partial template for '${pkey}'`);
                throw e;
            }
        } else if(given[pkey] instanceof Template) {
            imported[pkey] = given[pkey];
        } else {
            throw `Invalid partial: must be instance of Template or template string ('${pkey}' is ${typeof given[pkey]})`;
        }
    }
    return imported;
}

class Interface {

    constructor(template, options) {
        options = options || {};
        this._errorOnFuncFailure = options.errorOnFuncFailure || DEFAULT.errorOnFuncFailure;
        this._evalZeroAsTrue     = options.evalZeroAsTrue     || DEFAULT.evalZeroAsTrue;
        this._escapeAll          = options.escapeAll          || DEFAULT.escapeAll;
        this._errorOnMissingTags = options.errorOnMissingTags || DEFAULT.errorOnMissingTags;
        this._template           = template;
        this._root               = null;
        this._ogPartials         = loadPartials(options.partials, options.delimiters);
        this._partials           = {};
        this._options            = {};
        this._errorHandler       = null;
    }

    get errorOnFuncFailure() {
        return ('errorOnFuncFailure' in this._options) ? this._options.errorOnFuncFailure : this._errorOnFuncFailure;
    }
    get evalZeroAsTrue() {
        return ('evalZeroAsTrue' in this._options)     ? this._options.evalZeroAsTrue     : this._evalZeroAsTrue;
    }
    get escapeAll() {
        return ('escapeAll' in this._options)          ? this._options.escapeAll          : this._escapeAll;
    }
    get errorOnMissingTags() {
        return ('errorOnMissingTags' in this._options) ? this._options.errorOnMissingTags : this._errorOnMissingTags;
    }
    set errorOnFuncFailure(to) { if(typeof to !== "undefined") this._errorOnFuncFailure = Boolean(to); }
    set evalZeroAsTrue(to)     { if(typeof to !== "undefined") this._evalZeroAsTrue     = Boolean(to); }
    set escapeAll(to)          { if(typeof to !== "undefined") this._escapeAll          = Boolean(to); }
    set errorOnMissingTags(to) { if(typeof to !== "undefined") this._errorOnMissingTags = Boolean(to); }

    _missingHandler(key, throwError) {
        if(throwError || this._errorOnMissingTags) {
            throw `Render error: missing binding for '${key}'`;
        };
        return "";
    }

    render(bindings, options) {
        options = options || {};
        this._options = {
            errorOnFuncFailure: options.errorOnFuncFailure === undefined ? this.errorOnFuncFailure : options.errorOnFuncFailure, 
            evalZeroAsTrue:     options.evalZeroAsTrue     === undefined ? this.evalZeroAsTrue     : options.evalZeroAsTrue, 
            escapeAll:          options.escapeAll          === undefined ? this.escapeAll          : options.escapeAll, 
            errorOnMissingTags: options.errorOnMissingTags === undefined ? this.errorOnMissingTags : options.errorOnMissingTags
        };

        this._errorHandler = (throwError => {
            return key => {
                return exception => {
                    if(throwError) throw exception;
                    console.error(`Error evaluating bindings at ${key}`);
                    console.error(exception);
                    return "";
                };
            };
        })(this._errorOnFuncFailure);

        try {
            if(bindings instanceof Domain) {
                this._root = bindings.reroot();
            } else {
                this._root = new Domain(bindings);
            }

            // map partials, convert to interface
            this._partials = {};
            for(let pkey in this._ogPartials) {
                this._partials[pkey] = this._ogPartials[pkey];
            }
            let addPartials = loadPartials(options.partials, options.delimiters)
            for(let pkey in addPartials) {
                this._partials[pkey] = addPartials[pkey];
            }
            for(let pkey in this._partials) {
                this._partials[pkey] = new Interface(this._partials[pkey], this._options);
            }

            return this._renderInsideOut(this._renderOutsideIn(this._template.root));

        } finally {
            // clean up references and temporary variables
            //if(this._root) this._root.cleanup();
            this._root     = null;
            this._partials = {};
            this._options  = {};
        }
    }

    _getContext(node, domain, dynamics) {
        var result = new Context(node, domain, dynamics, this._errorHandler(node.raw));
        if(!result.domain) return null;
        result.resolve(this._root);
        return result;
    }

    /*
     * Rendering loop from the outside-in. Idea is to treat show/hide sections first this way to eliminate 
     * large chunks of hidden sections without wasting effort rendering what's inside.
     * 
     * Skips handling direct content for repeating sections and sections passed as context, that's handled in 
     * _renderInsideOut(). However inner content referencing bindings not for repeating data should be 
     * handled. Tricky part is managing unresolved contexts as we parse through entire template.
     *
     * @param root       - The root node to process from
     * @param domain     - The current data domain.
     * @param processed  - Array of nodes to pass to return for next round of processing.
     * @param unresolved - Array of data domains in context that are unresolved (i.e. repeating).
     */
    _renderOutsideIn(root, domain, processed, unresolved) {
        domain     = domain || this._root;
        processed  = processed || new RootNode();
        unresolved = unresolved || [];

        var node, context, forSection, checkNode, cantResolve, processSection;
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

            // can't resolve node in-context tied to a repeating section
            if(domain.isrepeating && node.incontext) {
                processed.inner.push(node);
                continue;
            }

            forSection = node instanceof SectionNode;

            // additional unresolved checks against unresolvable nodes
            checkNode = !forSection && node.directive !== DIRECTIVES.LIST;
            if(unresolved.length && (checkNode || node.func.length)) {
                cantResolve = unresolved.find(urdom => (
                    // can't resolve node (excluding sections and lists -- handled separately)
                    checkNode && urdom.incontext(node.key)
                    // can't resolve a passed-to function
                    || node.func.find(fn => urdom.incontext(fn.key))
                ));
                if(cantResolve) {
                    processed.inner.push(node);
                    continue;
                }
            }

            // get data context -- if null, likely due to nesting into dynamic data, so defer processing
            context = this._getContext(node, domain);
            if(!context) {
                processed.inner.push(node);
                continue;
            }

            // render sections -- handler split out for readability, but from there can recurse back into 
            // this function
            if(forSection) {
                this._section(node, context, processed, unresolved);
                continue;
            }

            // render straight values unless it depends on dynamic context (those defer till 2nd round)
            processed.inner.push(this._renderValue(node, context.value));
        }

        return processed;
    }

    _section(node, context, processed, unresolved, dynamics) {
        // Repeating sections and as-context sections (i.e. pass section as context) recurse inner content to 
        // process any non-dynamic referencing tags, but also add node to processing array for final 
        // processing in inside-out rendering.
        if(context.isrepeating || node.passcontext) {
            if(node.inclusive && (node.passcontext || context.length)) {
                // Copy section node and replace any in-context shortcuts with full path as it will be handled
                // later, potentially out of context.
                var dynode = new SectionNode(node);
                if(dynode.incontext) {
                    dynode.key = context.domain.fullkey;
                    dynode.incontext = false;
                    dynode._finish();
                }
                dynode.func.forEach((fn, i) => {
                    if(!fn.incontext) return;
                    fn.key = context.func[i].fullkey;
                    fn.incontext = false;
                    fn._finish();
                });
                let domain = context.toDynamicDomain();
                // Add to unresolved domains, recurse, pop unresolved domain, add to processing
                unresolved.push(domain);
                this._renderOutsideIn(node, domain, dynode, unresolved, dynamics);
                unresolved.pop();
                processed.inner.push(dynode);
            }
            return;
        }
        // Standard sections (or skip if not displayed)
        let domain = context.toDynamicDomain();
        if(this._display(node.inclusive, domain)) {
            // copy and insert empty section node to preserve context/nesting hierarchy on normal sections
            var processSection = new SectionNode(node);
            processed.inner.push(processSection);
            // recurse back into outside-in rendering for section
            this._renderOutsideIn(node, domain, processSection, unresolved, dynamics);
        }
    }

    /*
     * Rendering loop from the inside out. Idea is to rendering repeating sections from inner-most outwards to
     * avoid as much redundancy as possible. Only remaining tags should by repeating sections, sections passed
     * as context (which needs interior rendered to text), or tags dependent on the dynamic data domain inside
     * a repeating section. So everything gets processed or is a missing data binding.
     */
    _renderInsideOut(root, domain, dynamics) {
        domain = domain || this._root;
        dynamics = dynamics || [];

        var node, context, useDomain, dydom, processed = [], rendered;
        root.inner.forEach(node => {
            // only handle sections for this first outside-in loop
            if(!(node instanceof SectionNode)) {
                processed.push(node);
                return;
            }

            // get context, missing here is either skip or exception thrown
            context = this._getContext(node, domain, dynamics);
            if(!context) {
                this._missingHandler(node.raw);
                return;
            }

            // get domain for remaining node cases
            // if section-pass-as-context, use current domain, as isn't a real subdomain
            // otherwise, is repeating section or dynamic, convert context to dynamic domain
            useDomain = node.passcontext ? domain : context.toDynamicDomain();

            // pass section as context, render node to text, then finally pass to unresolved context function
            if(node.passcontext && !context.isresolved) {
                rendered = this._renderInsideOut(node, useDomain, dynamics);
                processed.push(context.value(rendered));
                return;
            }

            // standard section bound to context within a dynamic data domain
            if(!context.isrepeating) {
                if(this._display(node.inclusive, useDomain)) {
                    processed.push(this._renderInsideOut(node, useDomain, dynamics));
                }
                return;
            }

            // only thing left is repeating sections
            var pieces = [];
            for(let i = 0; i < context.length; ++i) {
                dydom = useDomain.dynamic.get(i);
                dynamics.push(dydom);
                if(this._display(true, dydom)) {
                    pieces.push(this._renderInsideOut(node, dydom, dynamics));
                }
                dynamics.pop();
            }
            // either just add nodes to processed or convert to grammatic list
            if(!node.list) {
                processed = processed.concat(pieces);
            } else {
                switch(pieces.length) {
                    case 0:
                        break;
                    case 1:
                        processed.push(pieces[0]);
                        break;
                    case 2:
                        processed.push(`${pieces[0]} and ${pieces[1]}`);
                        break;
                    default:
                        let last = pieces.pop();
                        processed.push(pieces.join(", ") + `, and ${last}`);
                        break;
                }
            }
        });

        // this part will run from inner-most out on all remaining nodes
        var text = "";
        processed.forEach(node => {
            if(node instanceof TextNode) {
                text += node.text;
            } else if(typeof node === "string") {
                text += node;
            } else {
                context = this._getContext(node, domain, dynamics);
                if(!context) {
                    text += this._missingHandler(node.raw);
                } else {
                    text += this._renderValue(node, context.value);
                }
            }
        });
        return text;
    }

    _display(inclusive, domain) {
        let display =  domain.value();
        switch(domain.type) {
            case TYPES.OBJECT:
                let _display = domain.get("_display");
                if(_display) return _display.value();
                break;
            // Should only occur in edge case with multi-dimensional arrays in repeating section render as any
            // repeating section tag (which hinges display on array length) checks this separately. See above 
            // in _section(). Thus commented out.
            // case TYPES.ARRAY:
            //     break;
            default:
                switch(typeof display) {
                    case "string":
                        display = display.trim();
                        break;
                    case "number":
                        display = display !== 0 ? display : this._evalZeroAsTrue;
                        break;
                }
                break;
        }
        return inclusive === Boolean(display);
    }

    _partial(node, context) {
        if(!this._partials[node.key]) {
            if(this.errorOnMissingTags) throw `Render error: missing partial for ${node.key}`;
            console.warn(`Render error: missing partial for ${node.key}`)
            return "";
        }
        try {
            return this._renderValue(
                node, 
                this._partials[node.key].render(
                    node.incontext ? context : this._root, 
                    this._options
                )
            );
        } catch(e) {
            console.log(`Partial render error for '${node.raw}'`);
            console.warn(e);
            return "";
        }
    }

    _renderValue(node, value) {
        // if functions exist (as pass-as-context node), formatting will be applied during context evaluation
        let hasfuncs = node.func && node.func.length, 
            format   = !hasfuncs && node.format, 
            escape   = this._escapeAll || (!hasfuncs && node.escape), 
            type     = typeOf(value);
        if(type <= TYPES.NULL) return "";
        // format list (unless not array, then normal handling)
        if(node.directive === DIRECTIVES.LIST && type === TYPES.ARRAY) {
            value = value.map(vi => {
                // multi-dimensional arrays simply converted to string
                if(Array.isArray(vi)) return `[${vi.toString()}]`;
                return formatValue(vi, format, escape);
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
        // other non-value types, convert to string
        switch(type) {
            case TYPES.ARRAY:
                value = `[${value.toString()}]`;
                format = false;
                break;
            case TYPES.OBJECT:
                value = JSON.stringify(value);
                format = false;
                break;
        }
        // final format and add
        return formatValue(value, format, escape);
    }

};

export default Interface;