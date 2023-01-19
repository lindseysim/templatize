import {SectionNode} from "./nodes.js";
import {evalf}       from "./misc.js";

class Context {

    constructor(node, domain, dynamics, onFuncError) {
        this._onError    = onFuncError;
        this.node        = node;       // node tied to this context
        this.isdynamic   = false;      // dynamic domains are those that are ephemeral in domain tree -- e.g. 
                                       // context passed to function or repeating sections
        this.isresolved  = false;      // if not resolved, this.value is a function to resolve
        this.isrepeating = false;      // if domain for repeating section
        this.length      = 0;          // length of dynamic domains to be handled in same context
        this.domain      = null;       // the corresponding data domain for the node
        this.func        = [];         // corresponding data domain for any pass-to-function(s)
        this.value       = undefined;  // the final data value (or function if unresolved)

        // get domain of node, checking dynamic contexts and then the provided domain
        let findDomain = (searchNode, atDomain) => {
            if(!searchNode.incontext && dynamics && dynamics.length) {
                for(let d = dynamics.length-1; d >= 0; --d) {
                    if(dynamics[d].incontext(searchNode.key)) {
                        return dynamics[d].search(searchNode, this._onError);
                    }
                }
            }
            return atDomain.search(searchNode, this._onError);
        }
        this.domain = findDomain(this.node, domain, dynamics);
        // if domain can't be found -- which might be to dynamic domains not yet populated enough
        if(!this.domain) return;

        if(this.node.func.length) {
            // node is dynamic as function(s) output depend on context, get domains of function(s)
            this.isdynamic = true;
            this.func = this.node.func.map(fn => findDomain(fn, domain));
            if(this.func.find(fn => !fn)) throw `Context passed to unresolved function at ${this.node.raw}`;
            if(this.func.find(fn => !fn.function)) throw `Context passed to non-function at ${this.node.raw}`;
        }
    }

    resolve(root) {
        if(this.isresolved || this.value !== undefined) return;
        // if not pass-to-function(s), simply resolve value from domain, only dynamic possibility is repeating
        // sections
        if(!this.node.func.length) {
            this.value      = this.domain.value(this._onError);
            this.isresolved = true;
            this.isdynamic  = this.isrepeating = this.domain.isrepeating;
            this.length     = this.domain.dynamic.length();
            this._onError   = null; // reference no longer needed
            return;
        }
        // functions are passed root data context as parameter
        var rootDomain = root && root.data || {};
        // node is pass-section-as-context, context is unresolved as need to render section text first
        // value becomes unresolved function with context as argument
        if(this.node instanceof SectionNode && this.node.passcontext) {
            this.value = context => {
                var iterval = context || this.domain.value(this._onError);
                this.func.forEach(fn => {
                    iterval = evalf(
                        fn.function, 
                        iterval, 
                        rootDomain, 
                        this._onError
                    );
                });
                return iterval;
            };
            this._onError = null; // reference no longer needed
            return;
        }
        // resolve value by passing context to function(s)
        this.value = this.domain.value(this._onError);
        this.func.forEach(fn => {
            this.value = evalf(
                fn.function, 
                this.value, 
                rootDomain, 
                this._onError
            );
        });
        this._onError = null; // reference no longer needed
        this.isresolved = true;
        // repeating section may result
        if(Array.isArray(this.value)) {
            this.isrepeating = true;
            this.length = this.value.length;
        }
    }

    toDynamicDomain() {
        if(!this.isresolved && !this.value) {
            throw "Attempting to create a dynamic domain from unresolved context.";
        }
        // if no reason to by dynamic, return domain as-is
        if(this.isrepeating && !this.func.length || !this.isdynamic) return this.domain;
        // cycle through function(s), appending function-name-chain for dynamic key-name
        var fnchain = "";
        this.func.forEach((fn, i) => {
            fnchain += `${i && "->" || ""}${fn.fullkey}()`;
        });
        return this.domain.dynamic.create(
            fnchain, 
            this.isresolved ? this.value : this.value()
        );
    }

}

export default Context;