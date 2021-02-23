import DIRECTIVES             from "./directives.js";
import {TYPES, typeOf, evalf} from "./misc.js";

class Binding {
    constructor(key, value, options) {
        options = options || {};
        this.key      = key;
        this.ukey     = key;
        this.value    = value;
        this.type     = typeOf(this.value);
        this.children = {};
        this.parent   = options.parent || null;
        this.context  = null;
        this._validate(options.allowNull);
        switch(this.type) {
            // for objects, attach '_parent' lookup
            case TYPES.OBJECT:
                this.value._parent = (this.parent && this.parent.value) || null;
                break;
            // for functions, parent is context
            case TYPES.FUNCTION:
                this.context  = (this.parent && this.parent.value) || {};
                break;
        }
    }
    _validate(allowNull) {
        // error checking data binding names goes here
        if(allowNull && !this.key) return;
        if(!this.key) throw `Invalid data-binding '${this.key}'`;
        let directive;
        switch(DIRECTIVES.TO_VALUE[this.key[0]]) {
            // user-error but permissible
            case DIRECTIVES.COMMENT:
                directive = "comment";
                break;
            case DIRECTIVES.LIST:
                directive = "list";
                break;
            case DIRECTIVES.PASS_CONTEXT:
                directive = "pass-to-function";
                break;
            case DIRECTIVES.FORMAT:
                directive = "format";
                break;
            case DIRECTIVES.ESCAPE:
                directive = "escape";
                break;
            // not-allowed
            case DIRECTIVES.SECTION_INC:
            case DIRECTIVES.SECTION_EXC:
            case DIRECTIVES.SECTION_END:
                throw `Invalid data-binding with leading section directive '${this.key}'`;
            case DIRECTIVES.PARTIALS:
                throw `Invalid data-binding with leading partial directive '${this.key}'`;
            case DIRECTIVES.IN_CONTEXT:
                throw `Invalid data-binding with leading in-context directive '${this.key}'`;
        }
        if(directive) {
            console.warn(`Data-binding with leading ${directive} directive: '${this.key}'`);
            break;
        }
    }
    killParent() {
        if(this.type === TYPES.OBJECT) delete this.value._parent;
    }
};

class Bindings {

    constructor(dataRoot, handleMissing) {
        this.root          = new Binding("", dataRoot, {allowNull: true});
        this.handleMissing = handleMissing;
        this.create        = {  // shortcuts
            dynamic: this.createDynamic.bind(this)
        };
    }

    exit() {
        this.cleanup(this.root);
        this.root = null;
    }

    cleanup(parent) {
        for(let ckey in parent.children) {
            if(parent.children[ckey].type === TYPES.OBJECT) {
                this.cleanup(parent.children[ckey]);
            }
        }
        parent.killParent();
    }

    createDynamic(params) {
        // dynamic domain still needs root, so 'fake' one as well
        var root = new Binding("", params.parent.value, {allowNull: true}), 
            child = new Binding(params.key, params.value, {parent: params.parent});
        // connect root to child (child to root handled in bindings construction)
        root.value[child.key] = child.value;
        root.children[child.key] = child;
        // dynamic key suffix must ensure unique key for dict
        child.ukey = `${child.key}~${params.dkey}`;
        // dict sub-items of this binding (under this unique key)
        this.map(child);
        // return the root as the domain
        return root;
    }

    map(parent) {
        if(parent.type !== TYPES.OBJECT) return;
        let prefix = parent.key ? parent.key+"." : "", 
            uprefix = parent.ukey ? parent.ukey+"." : "", 
            trimkey, fullkey, ukey, child;
        for(let key in parent.value) {
            trimkey = key.trim();
            // skip reserved values
            if(trimkey === "_display" || trimkey === "_parent") continue;
            if(trimkey !== key) console.warn(`Data-binding with leading/trailing whitespace '${key}'`);
            // update full key path and full unique key path
            fullkey = prefix + trimkey;
            ukey = uprefix + key;
            // create binding
            child = this._add({
                key:    fullkey, 
                ukey:   ukey, 
                value:  parent.value[key], 
                parent: parent
            });
            parent.children[key] = child;
            // recurse into objects
            this.map(child);
        }
    }

    _add(params) {
        var binding;
        // create binding
        binding = new Binding(params.key, params.value, {parent: params.parent});
        if(params.ukey) binding.ukey = params.ukey;
        // if dynamic binding create above root context and push binding as its child
        // this is since within dynamic data domain, we rebase the root, but still need root binding
        if(binding.dynamic || binding.dynamic === 0) {
            let root = new Binding("", {[binding.key]: binding.value}, null, true);
            root.children[binding.key] = binding;
            binding = root;
        }
        return binding;
    }

    eval(node, binding, params) {
        params = params || {};
        let value = binding.value, 
            type  = binding.type;
        // if function, evaluate until resolves
        if(type === TYPES.FUNCTION && !params.canReturnFunc) {
            value = evalf(value, binding.context, params.onFuncError);
            type = typeOf(value);
        }
        // if pass-to-function resolve function reference and call it on context
        if(node.func) {
            binding = this.get(
                node.func, 
                // either given context of node or reset
                node.func.incontext ? binding.context : this.root, 
                {
                    onFuncError:   params.onFuncError, 
                    handleMissing: "null",  // return null if missing, handle missing separately below
                    canReturnFunc: true     // don't evaluate functions for final value
                }
            );
            if(!binding) throw `Render error: can't resolve pass-to function at ${node.raw}`;
            if(binding.type !== TYPES.FUNCTION) throw `Render error: context passed to non-function at ${node.raw}`;
            value = evalf(binding.value, value, params.onFuncError);
            type = typeOf(value);
        }
        return {value: value, type: type};
    }

    get(node, domain, params) {
        domain = domain || this.root;
        params = params || {};
        // note this doesn't allow null for binding search except by way of default missing handler
        var binding   = this.getBinding(node, domain, params);
        if(!binding) return {
            binding: null, 
            value:   undefined, 
            type:    TYPES.UNDEFINED
        };
        var evaluated = this.eval(node, binding, params);
        return {
            binding: binding, 
            value:   evaluated.value, 
            type:    evaluated.type
        };
    }

    getBinding(node, domain, params) {
        domain = domain || this.root;
        params = params || {};
        let fullkey = node.fullkey(domain), 
            keysplit = fullkey.split("."), 
            result;
        // search down key path for binding
        while(keysplit.length) {
            result = this._search(domain, keysplit);
            if(!result) break;
            domain = result.binding;
            keysplit = keysplit.slice(result.keyIndex+1);
        }
        // handle missing binding
        if(!result) return this._missing(fullkey, params.handleMissing);
        // if used up full key, then at exact binding
        if(!keysplit.length) return domain;
        // might be dynamic data (e.g. function that returns object or array)
        // split out and search, but don't bind as these are always refreshed for each call (since dynamic)
        let binding = null;
        switch(domain.type) {
            // no other type makes sense here, should've been pre-mapped otherwise
            case TYPES.FUNCTION:
            case TYPES.ARRAY:
                binding = this._searchDynamic(
                    {
                        node:        node, 
                        binding:     result.binding, 
                        value:       result.binding.value, 
                        type:        result.binding.type, 
                        onFuncError: params.onFuncError
                    }, 
                    keysplit
                );
        }
        if(!binding) return this._missing(fullkey, params.handleMissing);
    }

    _search(domain, keysplit) {
        let ckey, child, keyIndex;
        for(let i = 0; i < keysplit.length; ++i) {
            ckey = ckey ? ckey + "." + keysplit[i] : keysplit[i];
            if(ckey in domain.children) {
                child = domain.children[ckey];
                keyIndex = i;
                break;
            }
        }
        return !child ? null : {
            binding: child, 
            keyIndex: keyIndex
        };
    }

    _searchDynamic(params, keysplit) {
        let value = params.value;
        switch(params.type) {
            // evaluate function until it resolves a value we can parse
            case TYPES.FUNCTION:
                try {
                    value = this.eval(params.node, params.binding, params.errorHandler).value;
                } catch(e) {
                    console.log(e);
                    return null;
                }
                params.value = value.value;
                params.type = value.type;
                return this._searchDynamic(params, keysplit);
            case TYPES.ARRAY:
                break;
            default:
                break;
        }
        // continue search normally with new data context
        return this.getBinding(params.node, params.binding, params.handleMissing);
    }

    _missing(key, handleMissing) {
        switch(handleMissing || this.handleMissing) {
            case "throw":
            case "error":
                throw `Render error: missing binding for '${key}'`;
            case "null":
                return null;
            default:
                return new Binding(key, "", {});
                break;
        }
    }

};

export {Binding, Bindings};