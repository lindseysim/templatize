import DIRECTIVES from "./directives.js";


function isDirective(directive, slice) {
    let sym = DIRECTIVES.TO_SYMBOL[directive];
    if(sym && this.key.slice(0, sym.length) === sym) {
        if(slice) this.key = this.key.slice(sym.length);
        return true;
    }
    return false;
}


function parseFormatDirectives() {
    let sym = DIRECTIVES.TO_SYMBOL[DIRECTIVES.FORMAT], 
        split = this.key.split(sym);
    // leading or ending with format directive, assume part of name
    if(split.length === 2) {
        if(!split[0] && !this.incontext) {
            split = [split[1]];
        } else if(!split[1]) {
            split = [split[0]];
        }
    }
    if(split.length > 1) {
        if(split.length > 2) {
            throw `Invalid tag: multiple format directives at ${this.raw}`;
        }
        if((!split[0] && !this.incontext) || !split[1] || split[1][0] === sym[0]) {
            throw `Invalid tag: malformatted format directive at ${this.raw}`;
        }
        this.format = split[1];
        this.key = split[0];
    }
    // escape directive
    sym = DIRECTIVES.TO_SYMBOL[DIRECTIVES.ESCAPE];
    split = this.key;
    if(split.endsWith(sym)) {
        this.escape = true;
        split = split.slice(0,-sym.length);
        this.key = split;
    }
    if(this.format.endsWith(sym)) {
        this.escape = true;
        this.format = this.format.slice(0,-sym.length);
    }
}

// basic node type
class Node {
    constructor(key) {
        this.key      = key || "";  // data key of tag
        this.keysplit = [];         // data key split by nested separators
    }
    _finish() {
        this.keysplit = this.key.split(".");
    }
}

// root processing node, has no function except to nest nodes within
class RootNode extends Node {
    constructor() {
        super();
        this.inner = [];  // list of nested nodes
    }
}

// node representing raw text (for both template and rendered)
class TextNode extends Node {
    constructor(text) {
        super();
        this.text = text;  // text node is just the string content
    }
}

// node representing a tag, both in the template and left as-is for basic tags
class TagNode extends Node {
    constructor(raw, inner) {
        super();
        this.raw       = raw.trim();   // raw tag string (including delimiters)
        this.tagstr    = inner.trim(); // tag string (trimming delimiters and whitespace)
        this.directive = 0;            // primary tag type (of all major tag-type directives)
        this.incontext = false;        // if bound to data within context
        this.key       = "";           // data key of tag
        this.func      = [];           // if pass to function(s), linked to nodes for function keys
        this.format    = "";           // formatting directive
        this.escape    = false;        // short-hand escape HTML format directive (suffix ";")
        // ignore empties (by marking as comment)
        if(!this.tagstr.length) {
            this.directive = DIRECTIVES.COMMENT;
        } else {
            this.key = this.tagstr;
            // first handle multi-character and other special directives
            if(isDirective.call(this, DIRECTIVES.LIST_SECTION, true)) {
                // special case of list and section
                this.directive = DIRECTIVES.LIST_SECTION;
            } else if(isDirective.call(this, DIRECTIVES.PASS_SECTION, true)) {
                // special case of section pass as context
                this.directive = DIRECTIVES.PASS_SECTION;
            } else {
                // match against single-character directives
                this.directive = DIRECTIVES.TO_VALUE[this.key[0]];
                // special-case handling
                switch(this.directive) {
                    case null:
                    case undefined:                // no match
                    case DIRECTIVES.IN_CONTEXT:    // handled separately as can be doubled-up behind directive
                    case DIRECTIVES.PASS_CONTEXT:  // here and below are not leading directives
                    case DIRECTIVES.FORMAT:
                    case DIRECTIVES.ESCAPE:
                        this.directive = 0;
                        break;
                    case DIRECTIVES.ROOT_PARTIAL:  // this one doubles as exclusive section so special case
                        this.directive = DIRECTIVES.SECTION_EXC;
                    default:
                        this.key = this.key.slice(DIRECTIVES.TO_SYMBOL[this.directive].length);
                }
            }
            // in-context-directive
            if(isDirective.call(this, DIRECTIVES.IN_CONTEXT, true)) {
                this.incontext = true;
            }
            // pass-as-context directive
            let sym = DIRECTIVES.TO_SYMBOL[DIRECTIVES.PASS_CONTEXT], 
                split = this.key.split(sym);
            // note pure context tag {{.}} can be split with empty first {{.~tofunc}}
            if(split.length > 1) {
                this.key = split[0];
                if((!this.key && !this.incontext)) {
                    throw `Invalid tag: malformatted function context directive at ${this.raw}`;
                }
                this.func = split.slice(1).map(fn => fn.trim());
                this.func.forEach(fn => {
                    if(!fn || (fn.length >= sym.length && fn.slice(0, sym.length) === sym[0])) {
                        throw `Invalid tag: malformatted pass-to-function at ${this.raw}`;
                    }
                });
            }
            // format directive
            parseFormatDirectives.call(this);
            // convert pass-to-function key to node
            this.func = this.func.map(fn => new PassToFunctionNode(fn, this));
        }
        // final key check
        this.key = this.key.trim();
        if(!this.key.length && !this.incontext) {
            // can't be empty except special case for pure context {{.}}
             throw `Invalid tag: empty evaluation at ${this.raw}`;
        }
        // this fills keysplit
        this._finish();
    }
};

// node representing the separated function in a pass-context-to-function tag
class PassToFunctionNode extends Node {
    constructor(key, contextNode) {
        if(key instanceof PassToFunctionNode) {
            // copy only
            super(key.key);
            this.format    = key.format;
            this.escape    = key.escape;
            this.incontext = key.incontext;
        } else {
            super(key);
            this.format    = "";
            this.escape    = false;
            this.incontext = false;
            // function can have context directive, but can't be pure context -- e.g. {{data~.}}
            if(this.key[0] === DIRECTIVES.TO_SYMBOL[DIRECTIVES.IN_CONTEXT]) {
                this.key = this.key.slice(DIRECTIVES.TO_SYMBOL[DIRECTIVES.IN_CONTEXT].length);
                this.incontext = true;
            }
            if(!this.key.length && !this.incontext) throw `Invalid tag: empty evaluation at ${contextNode.raw}`;
            // format directive
            parseFormatDirectives.call(this);
        }
        this._finish();
    }
};

// node representing a partial, build off the TagNode it came from
class PartialNode extends Node {
    constructor(tag) {
        if(tag instanceof SectionNode) throw `Partial tag cannot be used as section at ${tag.raw}`;
        if(tag.func.length) throw `Partial tag cannot be paired with pass-to-function directive at ${tag.raw}`;
        super(tag.key);
        this.raw       = tag.raw;
        this.directive = DIRECTIVES.PARTIAL;
        this.tag       = tag;
        this.incontext = tag.incontext;
        this.format    = tag.format;
        this.escape    = tag.escape;
        this._finish();
    }
};

// node representing a section, build off the TagNode it came from
class SectionNode extends Node {
    constructor(tag, parent) {
        super(tag.key);
        this.raw       = tag.raw;
        this.directive = tag.directive;
        this.tag       = tag;            // link to tag node from when parsed in template
        this.inner     = [];             // list of nested nodes within section
        this.incontext = tag.incontext;  // if bound to data within context
        this.parent    = parent;         // link to parent section node (or root node if not nested)
        if(tag instanceof SectionNode) {
            this.open        = tag.open;         // link to open tag instance (link to close tag not needed)
            this.list        = tag.list;         // is section list
            this.inclusive   = tag.inclusive;    // inclusive or exclusive type
            this.passcontext = tag.passcontext;  // is section passed as context
                                                 // if pass to function, linked to node for function key
            this.func        = tag.func;
        } else {
            this.open        = tag;
            this.inclusive   = tag.directive !== DIRECTIVES.SECTION_EXC;
            this.list        = this.inclusive && tag.directive === DIRECTIVES.LIST_SECTION;
            this.passcontext = this.inclusive && !this.list && tag.directive === DIRECTIVES.PASS_SECTION;
            this.func        = !this.passcontext ? tag.func : [new PassToFunctionNode(tag.key, tag)];
            if(tag.format) throw `Invalid tag: format passed to section tag ${tag.raw}`;
            if(tag.escape) throw `Invalid tag: escape directive passed to section tag ${tag.raw}`;
            if(this.inclusive && !this.list && !this.passcontext && tag.directive !== DIRECTIVES.SECTION_INC) {
                throw `Template error: parsing invalid section tag ${tag.raw}`;
            }
        }
        this._finish();
    }
}

export {Node, RootNode, TextNode, TagNode, PassToFunctionNode, PartialNode, SectionNode};