import {Node}                 from "./nodes.js";
import {TYPES, typeOf, evalf} from "./misc.js";

class Domain {

    constructor(data, fullkey, parent, handleMissing) {
        this.fullkey       = fullkey || "";
        this.prefix        = this.fullkey ? this.fullkey + "." : this.fullkey;
        this.data          = data;
        this.function      = null;
        this.type          = typeOf(this.data);
        this.parent        = parent || null;
        this.handleMissing = handleMissing || (this.parent && this.parent.handleMissing) || "throw";
        this.cache         = parent && parent.cache || {};
        this.children      = {".": this};
        this.isdynamic     = false;
        this.dynamic       = {
            length:  this.lengthDynamic.bind(this), 
            context: this.getDynamic.bind(this), 
            'get':   this.getDynamic.bind(this), 
            create:  this.createDynamic.bind(this)
        };
        switch(this.type) {
            // object parent reference
            case TYPES.OBJECT:
                this.data._parent = (this.parent && this.parent.data) || null;
                break;
            // function store reference to function, data is f() output but resolved whenever first called
            case TYPES.FUNCTION:
                this.function = this.data;
                this.data = null;
                break;
            // dynamic data that changes based on context (e.g. an array where items iterated with same tags)
            case TYPES.ARRAY:
                this.isdynamic = true;
                break;
        }
    }

    killAllParents() {
        let child;
        for(let key in this.children) {
            child = this.children[key];
            if(child !== this && child.type === TYPES.OBJECT) {
                delete child.data.parent;
                child.cleanup();
            }
        }
    }
    cleanup() {
        this.killAllParents();
    }

    // missing value handler
    missing(key, handleMissing) {
        switch(handleMissing || this.handleMissing) {
            case "throw":
            case "error":
                throw `Render error: missing binding for '${key}'`;
            case "null":
                return null;
            default:
                return "";
                break;
        }
    }

    _eval(onFuncError) {
        if(this.function && !this.data) {
            this.data = evalf(this.function, this.parent.data);
            this.type = typeOf(this.data);
            if(this.type === TYPES.ARRAY) {
                this.isdynamic = true;
            } else {
                this.cache[this.fullkey] = this;
            }
        }
    }

    // get raw value (assumed called when already in inner-most context)
    // in dynamic domain, can only return exact data unless special key-name with index
    value(onFuncError) {
        this._eval(onFuncError);
        return this.data;
    }

    // get child data domain / subcontext
    // if function and first time, evaluates function till non-function type and changes type
    // if called in dynamic domain, return nulls
    get(key, onFuncError, skipCache) {
        let fullkey;
        if(key && key !== ".") {
            fullkey = this.prefix + key;
        } else {
            fullkey = this.fullkey;
            key = ".";
        }
        // functions render on first handle to resolve what data is
        this._eval(onFuncError);
        // check cache
        if(!skipCache && fullkey in this.cache) return this.cache[fullkey];
        // can't normal 'get' dynamic children, 'getDynamic'
        if(this.isdynamic) return null;
        // get context or create if not yet existing
        if(key in this.children) return this.children[key];
        if(!(key in this.data)) return null;
        var subcontext = new Domain(this.data[key], fullkey, this);
        this.children[key] = this.cache[fullkey] = subcontext;
        return subcontext;
    }

    // get dynamic length
    // if called in non-dynamic domain, returns 1 (or 0 if null)
    lengthDynamic() {
        switch(this.type) {
            case TYPES.ARRAY:
                return this.data.length;
            case TYPES.NULL:
            case TYPES.UNDEFINED:
                return 0;
        }
        return 1;
    }

    // get dynamic context by index
    // if called in non-dynamic domain, returns self
    getDynamic(index, context) {
        if(!this.isdynamic) return this;
        let dykey = `${this.fullkey}<~>${index}`;
        // get context or create if not yet existing
        if(dykey in this.children) return this.children[dykey];
        context = new Domain(this.data[index], this.fullkey, this.parent);
        context.cache = {};  // disconnect cache for dynamic contexts
        this.children[dykey] = context;
        return context;
    }

    createDynamic(dkey, withData) {
        let dykey =`${this.fullkey}<~>(${dkey})`;
        // if context exists in children, clear existing first
        if(dykey in this.children) this.children[dykey].cleanup();
        // create context
        var context = new Domain(withData, this.fullkey, this.parent);
        context.cache = {};  // disconnect cache for dynamic contexts
        this.children[dykey] = context;
        return context;
    }

    // check if node is in this context (lazy search, doesn't check if most specific)
    incontext(fullKeyOrNode) {
        let key = fullKeyOrNode;
        if(fullKeyOrNode instanceof Node) {
            if(fullKeyOrNode.incontext) return true;
            key = fullKeyOrNode.key;
        }
        return key.startsWith(this.prefix);
    }

    // find context
    _search(fullkey, keysplit, onFuncError, bubble, atstart) {
        // if start of search, try cache
        if(atstart && fullkey in this.cache) {
            return this.cache[fullkey];
        }
        // if exactly at, return self
        if(!keysplit.length || this.fullkey === fullkey) return this;
        if(bubble) {
            // reverse search condition when in context or at root (can always bubble out of dynamic domain)
            if(!this.parent) {
                return this._search(fullkey, keysplit, onFuncError);
            } else if(this.incontext(fullkey)) {
                let i = -1;
                while(++i < keysplit.length && this.prefix.startsWith(keysplit[i]+".")) {
                    // all handled in loop condition
                }
                if(i && i < keysplit.length) keysplit = keysplit.slice(i);
                return this._search(fullkey, keysplit, onFuncError);
            }
            // continue bubbling (if exiting dynamic, reset 'atstart' to try parent's cache)
            return this.parent._search(fullkey, keysplit, onFuncError, true, this.isdynamic);
        }
        // to handle names with periods in them (user-error by try to work with), append key parts till match
        let subcontext, 
            key = "";
        for(let k = 0; k < keysplit.length; ++k) {
            key += keysplit[k];
            subcontext = this.get(key, onFuncError, true);
            if(subcontext) {
                if(subcontext === this) break;  // special case when key="."
                return subcontext._search(fullkey, keysplit.slice(k+1), onFuncError);
            }
            key += ".";
        }
        return keysplit.length ? null : this;
    }
    search(node, onFuncError) {
        // special case for {{.}}
        if(!node.key && node.incontext) return this;
        // try cache with full keys (note in-context nodes skip bubble)
        return this._search(node.key, node.keysplit, onFuncError, !node.incontext, true);
    }
    context(node, onFuncError) {
        return this.search(node);
    }
    from(node, onFuncError) {
        return this.search(node);
    }
}

export default Domain;