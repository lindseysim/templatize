import DIRECTIVES                   from "./directives.js";
import Parser                       from "./parser.js";
import eval                         from "./eval.js";
import {Cursor, Cache, ArrayCache}  from "./class.js";
import {Search}                     from "./search.js";


export default function(options) {
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

    this.render = function(html, bindings) {
        if(!html) return "";
        try {
            this.__data = {
                template: html, 
                nodes:    [], 
                bindings: bindings, 
                root:     new NodeValue("", bindings, null);
            };
            this.__cache  = new Cache();
            this.__data.nodes = Parser.parse(this.__data.template, this.__delimiters);
        } finally {
            this.__cache.kill();
            this.__cache  = null;
            this.__data   = null;
            let killYourParents = (obj) => {
                for(let val in object) {

                }
            };
        }
    };

    this.__render = function(cursor) {
        if(!cursor) cursor = new Cursor(this.__data.nodes);
        var value, 
            rendered = "", 
            node = cursor.next();
        while(node) {
            // text
            if(typeof node === "string") {
                value = node;
            } else {
                // parse node value
                value = this.__nodeTagValue(node);
                // handle section starts
                switch(node.directive) {
                    case DIRECTIVES.SECTION_INC:
                        value = this.__renderSection(cursor, value, node, true);
                        break;
                    case DIRECTIVES.SECTION_EXC:
                        value = this.__renderSection(cursor, value, node, false);
                        break;
                }
            }
            // TODO FORMATTING
            // append value
            rendered += value;
            node = cursor.next();;
        }
    };

    this.__handleFuncEx = function(node) {
        return(function(throwException, node) {
            return function(e, overflow) {
                console.error(`Function call error at: ${node.raw}`);
                if(throwException) {
                    if(e) throw e;
                    throw `Function overflow at: ${node.raw}`;
                } else {
                    console.error(e || `Function overflow at: ${node.raw}`);
                    return "";
                }
            };
        })(this.errorOnFuncFailure, node);
    };

    this.__findDatum = function(node) {
        if(typeof node === "string") return node;

        // ignore comments
        if(node.directive === DIRECTIVES.COMMENT) return "";
        // section ends should never be encountered here
        if(node.directive === DIRECTIVES.SECTION_END) throw `Invalid section structure encountered at: ${node.raw}`;

        // try to find datum
        let datum = this.__searchDatum(this.__data.root, this.__cache, node);
        if(datum === undefined && datum === null) {
            console.error(`Could not find binding for: ${node.raw}`);
            return null;
        }

        // set value and context
        let value, vtype, context,
        if(node.func) {
            // is context passed to function
            vtype = "function";
            // find function as value
            value = this.__searchDatum(this.__data.root, this.__cache, node.func);
            if(value === null || value === undefined) throw `Could not find function for: ${node.raw}`;
            if(typeof value !== "function") throw `Function reference is not a function for: ${node.raw}`;
            // and prop as context
            context = result.prop;
            if(result.type === "function") {
                context = eval(result.context, context, this.__handleFuncEx(node));
            }
        } else {
            value   = result.prop;
            vtype   = result.type;
            context = result.context;
        }
        // convert value if needed
        if(vtype === "function") {
            value = eval(value, context, errorHandler);
        }
        // list formatting
        if(node.directive === DIRECTIVES.LIST) {
            if(vtype !== "array") throw `List format with non-array value at: ${node.raw}`
            value = this.__listFormat(value);
        }
        return value;
    };


    this.__searchDatum = function(root, cache, node) {
        // try to find datum in cache
        let datum = cache && cache.get(node.key);
        if(datum !== undefined && datum !== null) return datum;
        // use searcher
        let handleException = this.__handleFuncEx(node), 
            search = new Search(root, node, cache, {handleException: handleException}), 
            result = null;
        while(!result) { result = search.next(); }
        if(!result.hasResult) {
            console.error(`Could not find binding for: ${node.raw}`);
            return null;
        }
        return result.value;
    };

    this.__renderSection = function(cursor, value, openNode, inclusive) {
        let open = {tag: openNode, index: cursor.i}, 
            close = this.__sectionEnd(open.tag, cursor, open.index+1);
        if(!close) throw `Unclosed section structure encountered at: ${open.raw}`;

        let isArray = Array.isArray(value);
        if(isArray) inclusive = inclusive && value.length;

        // render regular section (outside-in)
        if(!inclusive || !isArray) {
            // check display evaluation
            let display = true;
            if("_display" in item) {
                display = !!display;
            } else {
                value = (
                    // if set to, evaluate strict 0 as true
                    (this.evalZeroAsTrue && value === 0)
                    // only-whitespace is false
                    || (value && (typeof value !== "string" || value.trim().length))
                );
                display = Boolean(value) == Boolean(inclusive);
            }
            if(display) {
                // display section means one node past open tag, mark close tag as ignore (by marking as comment)
                close.node.directive = DIRECTIVES.COMMENT;
            } else {
                // hide section means moving index ahead past close tag
                cursor.index = close.index;
            }
            // doesn't return anything, just move cursor as appropriate
            return "";
        }

        // render repeating section (unless not displaying) (inside-out)
        // define recursive render function
        let render = section => {
            // extract nodes (child will return rendered string node)
            let nodes = [], 
                index = section.open.index;
            // recurse into all valid children
            section.nest.forEach((child, i) => {
                // include all nodes up to next child
                while(index < child.open.index) {
                    nodes.push(this.cursor.nodes[++index]);
                }
                // recurse into valid children
                if(child.include) nodes.push(render(child));
                // update index to child end
                index = child.close.index;
            });
            // render extracted nodes
            let sectionRender = "";
            // TODO RENDERING
            return sectionRender;
        };
        return render(this.__getSectionNest(cursor, open, close));
    };

    this.__listFormat = function(values) {
        switch(values.length) {
            case 1:
                return values[0];
            case 2:
                return `${values[0]} and ${values[1]}`;
            default:
                return values.forEach((item, i) => {
                        listStr += `${i ? ", " : ""}${i+1 === values.length ? "and " : ""}${item}`;
                    })
                    .join("");
        }
    };

    this.__sectionEnd = function(open, cursor, searchFrom) {
        let nested = 0, 
            node;
        for(let i = searchFrom; i < cursor.nodes.length; ++i) {
            node = cursor.nodes[i];
            if(node.key != open.key) continue;
            switch(node.directive) {
                case DIRECTIVES.SECTION_INC:
                case DIRECTIVES.SECTION_EXC:
                    ++nested;
                    break;
                case DIRECTIVES.SECTION_END:
                    if(--nested < 0) return {
                        node: node, 
                        index: i
                    };
            }
        }
        return null;
    };

    this.__getSectionNest = function(cursor, open, close) {
        let current   = this.__oSection(open, close), 
            key       = current.open.node.key, 
            root      = current, 
            inExclude = 0, 
            next      = this.__nSection(cursor, key, current.open.index, current.close.index);
        while(next) {
            switch(node.directive) {
                // closing tag
                case DIRECTIVES.SECTION_END:
                    // pop up if all current level has been closed
                    if(current.close) {
                        if(!current.up) throw `Malformed section structure for: ${current.open.node.raw}`;
                        current = current.up;
                        if(!current.close) throw `Malformed section structure for: ${current.open.node.raw}`;
                    }
                    current.close = close;
                    // exit exclude count if we can
                    if(!current.include) --inExclude;
                    break;
                // exclude tag (include for structure but mark to skip until resolved)
                case DIRECTIVES.SECTION_EXC:
                    ++inExclude;
                // include tag
                case DIRECTIVES.SECTION_INC:
                    next = this.__oSection(next, null, current);
                    next.include = inExclude > 0;
                    current.nest.push(next);
                    current = next;
                    break;
            }
            // find next node
            next = this.__nSection(cursor, key, current.open.index, root.close.index);
        }
        // if first nesting level isn't closed, something's wrong
        if(root.nest.length && !root.nest[root.nest.length-1].close) {
            throw `Malformed section structure for: ${current.open.node.raw}`;
        }
        return root;
    };

    this.__oSection = function(open, close, parent) {
        return {
            open:    open, 
            close:   close, 
            include: true, 
            nest:    [], 
            up:      parent
        };
    };

    this.__nSection = function(cursor, key, start, end) {
        let node;
        for(++start; start < end; ++start) {
            node = this.cursor.nodes[start];
            if(node.key != key) continue;
            switch(node.directive) {
                case DIRECTIVES.SECTION_INC:
                case DIRECTIVES.SECTION_EXC:
                case DIRECTIVES.SECTION_END:
                    return node;
            }
        }
        return false;
    };

};