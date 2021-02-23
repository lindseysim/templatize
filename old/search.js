import DIRECTIVES from "./directives.js";
import eval       from "./eval.js";
import {Datum}    from "./class.js";


class Search {

    constructor(root, node, cache, options) {
        options = options || {};
        this.root    = root;
        this.cache   = cache;
        this.node    = node;
        this.path    = options.path || this.node.path;
        this.end     = this.path.length-1;
        this.cursor  = {
            index: -1, 
            part:  "", 
            path:  "", 
            datum: this.root, 
            value: this.root.value(), 
            type:  Array.isArray(this.root) ? "array" : typeof this.root
        };
        this.vopts = {handleException : options.handleException || false};
        this._done = false;
        this._result = {
            done: false, 
            hasResult: false, 
            value: null
        };
        if(this.cursor.type !== "object") throw `Searching in non-object root`;
    }

    get result() {
        return this._result;
    }

    find() {
        while(!this._done) { this._next(); }
        return this._result;
    }

    _check(value) {
        return value !== null && value !== undefined;
    }

    _finish(value) {
        this._done = this._result.done = true;
        this._result.value = value;
        this._result.hasValue = this._check(this._result.value);
        return this._result;
    }

    _next() {
        // first and ended conditions
        if(!~this.cursor.index && this.cache) {
            let value = this.cache.get(this.node.key);
            if(value || value === 0) return this._finish(value);
        }
        if(this._done || this.cursor.index >= this.end) return this._finish();

        let part, fullpath, datum, 
            last = false;
        // loop until next part resolves
        while(this.cursor.index < this.end) {
            // move cursor
            ++this.cursor.index;
            last = this.cursor.index == this.end;
            part = this.path[this.cursor.index];

            // search with paths
            this.cursor.part = this.cursor.part + part;
            fullpath = (this.cursor.path ? this.cursor.path+"." : "") + this.cursor.part;
            datum = this._findDatum(value, fullpath, this.cursor.path);
            // if first and not found try with directive as part of name (would user error but try to handle)
            if(!datum && !this.cursor.index) {
                fullpath = DIRECTIVES._SYMBOLS[this.node.directive] + this.cursor.part;
                datum = this._findDatum(value, fullpath, fullpath);
            }

            if(datum) break;

            this.cursor.part += ".";
            this.cursor.path = fullpath;
        }

        if(!datum) return this._finish();

        // datum is either `true` (if found, but not yet cached) or Datum
        // create datum if wasn't in cache, grab its value
        if(!datum instanceof Datum) {
            this.cursor.datum = new Datum(this.cursor.path, this.cursor.value, this.cursor.datum);
            this.cursor.value = this.cursor.datum.value(this.vopt);
            this.cursor.type  = this.cursor.datum.type;
            this.cache.set(this.cursor.path, this.cursor.datum);
        }

        // if last, can return whatever this is
        if(last) return this._finish(this.cursor.value);

        // if datum type is function and not end of function, have to evaluate what actual value became
        if(this.cursor.type === "function") {
            this.cursor.type = Array.isArray(this.cursor.value) ? "array" : typeof this.cursor.value;
        }
        // if anything but array, continue search
        if(this.cursor.type != "array") return;

        // create ArraySearcher
        var aSearch = new ArraySearch({
            parent:   this, 
            array:    this.cursor,value, 
            rootPath: this.cursor.fullpath, 
            path:     this.path.slice(this.cursor.i), 
            vopts:    this.vopts
        });

    }

    _findDatum(parentValue, fullKey, key) {
        var datum = this.cache && this.cache.get(fullKey);
        if(datum !== undefined) return datum;
        if(!parentValue.hasOwnProperty(key)) return undefined;
        return true;
    }

};


class ArraySearch {

    constructor(options) {
        this.parent = parent;
        this.array  = array;
        this.node   = options.node;
        this.vopt   = options.vopts;
    }

};


export {Search, ArraySearch};