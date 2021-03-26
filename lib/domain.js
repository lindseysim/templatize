import {Node}                 from "./nodes.js";
import {TYPES, typeOf, evalf} from "./misc.js";

class Domain {

    constructor(data, fullkey, parent) {
        this.fullkey       = fullkey || "";
        this.prefix        = this.fullkey ? this.fullkey + "." : this.fullkey;
        this.prefixlen     = this.prefix.split(".").length - 1
        this.data          = data;
        this.function      = null;
        this.type          = typeOf(this.data);
        this.parent        = parent || null;
        this.root          = this.parent && this.parent.root || this;
        this.cache         = parent && parent.cache || {};
        this.children      = {".": this};
        this.isrepeating   = false;
        this.dynamic       = {
            children: {}, 
            length:   this.lengthDynamic.bind(this), 
            'get':    this.getDynamic.bind(this), 
            create:   this.createDynamic.bind(this)
        };
        switch(this.type) {
            // function store reference to function, data is f() output but resolved whenever first called
            case TYPES.FUNCTION:
                this.function = this.data;
                this.data = null;
                break;
            // dynamic data that changes based on context (e.g. an array where items iterated with same tags)
            case TYPES.ARRAY:
                this.isrepeating = true;
                break;
        }
    }

    reroot() {
        return Domain(this.data);
    }

    _eval(onFuncError) {
        if(this.function && !this.data) {
            this.data = evalf(this.function, this.parent.data, this.root.data);
            this.type = typeOf(this.data);
            if(this.type === TYPES.ARRAY) {
                this.isrepeating = true;
            } else {
                this.cache[this.fullkey] = this;
            }
        }
        return this.data;
    }

    /* 
     * Get raw value (assumed called when already in inner-most context). For functions uses evaluated value.
     */
    value(onFuncError) {
        return this._eval(onFuncError);
    }

    /* 
     * Get child data domain / subcontext. If function and first time, evaluates function till non-function 
     * type and changes type. If called in dynamic domain, return null.
     */
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
        // can't normal 'get' children of repeating sections (use getDynamic)
        if(this.isrepeating) return null;
        // get context or create if not yet existing
        if(key in this.children) return this.children[key];
        if(!(key in this.data)) return null;
        var subcontext = new Domain(this.data[key], fullkey, this);
        this.children[key] = this.cache[fullkey] = subcontext;
        return subcontext;
    }

    /* 
     * Get dynamic length.
     */
    lengthDynamic() {
        switch(this.type) {
            case TYPES.NULL:
            case TYPES.UNDEFINED:
                return 0;
            case TYPES.ARRAY:
                return this.data.length;
            default:
                return 1;
        }
    }

    /*
     * Get dynamic data domain with custom data. Must also supply unique key modifier.
     * 
     * Dynamic data domain acts as if in the same location as this domain (with same key and parent), but with
     * dynamic data that is different. Note that if search up to parent and back down, however, it cannot be 
     * re-found with same key. It is technically stored as a dynamic child of this domain.
     */
    createDynamic(dkey, withData, index) {
        var dykey =`<${index || 0}:${dkey}>`;
        if(dykey in this.dynamic.children) return this.dynamic.children[dykey];
        var context = new Domain(withData, this.fullkey, this.parent);
        context.cache = {};  // disconnect cache for dynamic contexts
        this.dynamic.children[dykey] = context;
        return context;
    }

    /*
     * Get dynamic data domain by index. Used for repeating sections to dynamically load the domain of an 
     * array item. If not an array-type, simply loads the current data.
     */
    getDynamic(index, onFuncError) {
        var data = this.isrepeating ? this.data[index] : this._eval(onFuncError);
        return this.createDynamic("", data, index);
    }

    /* 
     * Check if node is in this context (lazy search, doesn't check if most specific).
     */
    incontext(fullKeyOrNode) {
        let key = fullKeyOrNode;
        if(fullKeyOrNode instanceof Node) {
            if(fullKeyOrNode.incontext) return true;
            key = fullKeyOrNode.key;
        }
        return key === this.fullkey || key.startsWith(this.prefix);
    }

    /* 
     * Search for domain.
     */
    _search(fullkey, keysplit, onFuncError, bubble, atstart) {
        // if start of search, try cache
        if(atstart && fullkey in this.cache) return this.cache[fullkey];
        // if exactly at, return self
        if(!keysplit.length || this.fullkey === fullkey) return this;
        if(bubble) {
            // reverse search condition when in context or at root (can always bubble out of dynamic domain)
            if(!this.parent) {
                return this._search(fullkey, keysplit, onFuncError);
            } else if(this.incontext(fullkey)) {
                // remove incontext prefix from fullkey before searching inside
                let rmlen = -1;
                while(keysplit.length && ++rmlen < this.prefixlen) {
                    keysplit.shift();
                }
                return this._search(fullkey, keysplit, onFuncError);
            }
            // continue bubbling (if exiting dynamic, reset 'atstart' to try parent's cache)
            return this.parent._search(fullkey, keysplit, onFuncError, true, this.isrepeating);
        }
        // to handle names with periods in them (user-error by try to work with), append key parts till match
        let subcontext, key = "";
        for(let k = 0; k < keysplit.length; ++k) {
            key += keysplit[k];
            subcontext = this.get(key, onFuncError, true);
            if(subcontext) {
                if(subcontext === this) return this;  // special case when key="."
                return subcontext._search(fullkey, keysplit.slice(k+1), onFuncError);
            }
            key += ".";
        }
        return keysplit.length ? null : this;
    }
    search(node, onFuncError) {
        // special case for naked context tags
        if(!node.key && node.incontext) return this;
        // try cache with full keys (note in-context nodes skip bubble)
        return this._search(node.key, [...node.keysplit], onFuncError, !node.incontext, true);
    }
}

export default Domain;