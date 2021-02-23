import DIRECTIVES from "./directives.js";
import eval from "./eval.js";

class Cursor {
    constructor(items) {
        this.items = items;
        this._index = -1;
    }
    set(at) {
        this._index = at;
    }
    get i() {
        return this._index;
    }
    get index() {
        return this._index;
    }
    get item(i) {
        if(!i && i !== 0) i = this._index;
        if(i < 0 || i >= this.items.length) return null;
        return this.items[i];
    }
    node(i) {
        return this.item(i);
    }
    next() {
        if(++this._index >= this.items.length) return null;
        return this.item();
    }
}

class NodeTag {
    constructor(raw, inner) {
        this.raw       = raw;
        this.inner     = inner;
        this.key       = "";
        this.path      = "";
        this.directive = 0;
        this.func      = null;
        this.format    = "";

        // ignore empties
        if(!this.inner.length) {
            this.directive = DIRECTIVES.COMMENT;
            return;
        }
        this.key = this.inner;
        // leading directive
        for(let d in DIRECTIVES) {
            if(d[0] === "_") continue;
            d = DIRECTIVES[d];
            if(this.inner[0] === DIRECTIVES._SYMBOLS[d]) {
                this.directive = d;
                this.key = this.key.slice(1);
                break;
            }
        }
        // split path
        let sym, split;
        // context directive
        sym = DIRECTIVES._SYMBOLS[DIRECTIVES.PASS_CONTEXT];
        split = this.key.split(sym);
        if(split.length > 1 && split[0]) {
            if(split.length > 2) {
                throw `Tag (${this.raw}) has multiple function context directives`;
            }
            if(!split[0] || !split[1] || split[1][0] === sym[0]) {
                throw `Tag (${this.raw}) has a malformatted function context directive`;
            }
            this.key = split[0];
            this.func = split[1];
        }
        // format directive
        sym = DIRECTIVES._SYMBOLS[DIRECTIVES.FORMAT];
        split = (this.func || this.key).split(sym);
        if(split.length > 1 && split[0]) {
            if(split.length > 2) {
                throw `Tag (${this.raw}) has multiple format directives`;
            }
            if(!split[0] || !split[1] || split[1][0] === sym[0]) {
                throw `Tag (${this.raw}) has a malformatted format directive`;
            }
            this.format = split[1];
            if(this.func) {
                this.func = split[0];
            } else {
                this.key = split[0];
            }
        }
        // can't be only dots
        if(!this.key.replace(/^\.+|\.+$/g, '').length) throw `Tag (${this.raw}) is an invalid property name`;
        // split path by dot for raw path
        this.path = this._splitPath(this.key);
        if(!this.path) throw `Tag (${this.raw}) is an invalid property path`;
        if(this.func) {
            let funcpath = this.splitPath(this.func);
            if(!funcpath) throw `Tag (${this.raw}) is an invalid function path`;
            this.func = {
                key: this.func, 
                path: funcpath
            };
        }
    }
    _splitPath(fullpath) {
        var split = [], 
            path = "";
        for(let c = 0; c < fullpath.length; ++c) {
            // add to running
            if(fullpath[c] !== ".") {
                path += fullpath[c];
                continue;
            }
            // add on break (long as running isn't only dots)
            if(path && path[path.length-1] !== ".") {
                split.push(path);
                path = "";
                continue;
            }
            // leading periods assumed in name prefix
            path += ".";
        }
        // must have at least one real path
        if(!split.length) return null;
        // can also end on single period for flat arrays
        if(path) {
            if(path === ".") {
                split.push(path);
            } else {
                return null;
            }
        }
        return splti;
    }
}

class Datum {
    constructor(path, value, parent) {
        this._overflow = 32;
        this._path     = path, 
        this._value    = value;
        this._type     = Array.isArray(this._value) ? "array" : typeof this._value;
        this._parent   = parent;
    }
    get node() {
        return this.nodeTag;
    }
    get type() {
        return this._type;
    }
    get parent() {
        return this._parent;
    }
    value(options) {
        options = options || {};
        let context = options.context;
        if(typeof context === "undefined") context = this.parent;
        return this._get(
            this._value, 
            this._type, 
            typeof options.context === "undefined" ? this.parent || options.context, 
            options.handleException
        );
    }
    _get(value, type, context, handleException) {
        switch(type) {
            case "array":
                return value.map(item => {
                    // convert multidimensional arrays to strings
                    if(Array.isArray(item)) return `[${item.toString()}]`;
                    return this._get(item, (typeof item), context);
                });
            case "function":
                // functions keep getting called until it returns a non-function
                value = eval(value, context, handleException);
                return this._get(value, context);
            case "object":
                value._parent = context;
            default:
                return value;
        }
    }
    kill() {
        // node this bubbles
        this._kill(this._value, this._type);
    }
    _kill(value, type) {
        switch(type) {
            case "array":
                value.map(item => {
                    if(item._parent) delete item._parent;
                });
                return;
            case "function":
                value = eval(value, context, () => "");
                return this._kill(value, context);
            case "object":
                delete item._parent;
                return;
            default:
                return;
        }
    }
}

class Cache {
    constructor() {
        this._cache = {};
    }
    get(key) {
        return this._cache[key];
    }
    set(key, value) {
        if(key === null || key == undefined || key === "") throw "Cache key null, undefined, or empty";
        this._cache[key] = value;
    }
}

return {Cursor, NodeTag, Datum, Cache};