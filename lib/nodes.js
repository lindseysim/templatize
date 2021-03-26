import DIRECTIVES from "./directives.js";

class Node {
    constructor(key) {
        this.key      = key || "";
        this.keysplit = [];
    }
    _finish() {
        this.keysplit = this.key.split(".");
    }
}

class RootNode extends Node {
    constructor() {
        super();
        this.inner = [];
    }
}

class TextNode extends Node {
    constructor(text) {
        super();
        this.text = text;
    }
}

class TagNode extends Node {
    constructor(raw, inner) {
        super();
        this.raw       = raw;
        this.inner     = inner.trim();
        this.directive = 0;
        this.incontext = false;
        this.func      = null;
        this.format    = "";
        this.escape    = false;
        // ignore empties (by marking as comment)
        if(!this.inner.length) {
            this.directive = DIRECTIVES.COMMENT;
        } else {
            this.key = this.inner;
            // leading directive
            this.directive = DIRECTIVES.TO_VALUE[this.inner[0]];
            if(!this.directive) {
                this.directive = 0;
            } else if(this.directive === DIRECTIVES.LIST && DIRECTIVES.TO_VALUE[this.inner[1]] === DIRECTIVES.SECTION_INC) {
                // special case of list and section
                this.directive = DIRECTIVES.LIST_SECTION;
                this.key = this.key.slice(2);
            } else {
                switch(this.directive) {
                    case DIRECTIVES.IN_CONTEXT:    // handled separately as can be doubled-up
                    case DIRECTIVES.PASS_CONTEXT:  // here and below are not leading directives
                    case DIRECTIVES.FORMAT:
                    case DIRECTIVES.ESCAPE:
                        this.directive = 0;
                        break;
                    case DIRECTIVES.ROOT_PARTIAL:  // this one doubles as exclusive section so special case
                        this.directive = DIRECTIVES.SECTION_EXC;
                    default:
                        this.key = this.key.slice(1);
                }
            }
            // in-context-directive
            if(this.key[0] === DIRECTIVES.TO_SYMBOL[DIRECTIVES.IN_CONTEXT]) {
                this.incontext = true;
                this.key = this.key.slice(1);
            }
            if(this.directive === DIRECTIVES.PARTIAL && this.incontext) {
                throw `Invalid tag: cannot have partial directive as in-context at ${this.raw}`;
            }
            // context directive
            let sym, split;
            sym = DIRECTIVES.TO_SYMBOL[DIRECTIVES.PASS_CONTEXT];
            split = this.key.split(sym);
            // note pure context tag {{.}} can be split with empty first {{.~tofunc}}
            if(split.length > 1) {
                if(split.length > 2) {
                    throw `Invalid tag: multiple function context directives at ${this.raw}`;
                }
                if((!split[0] && !this.incontext) || !split[1] || split[1][0] === sym[0]) {
                    throw `Invalid tag: malformatted function context directive at ${this.raw}`;
                }
                this.key = split[0];
                this.func = split[1];
            }
            // format directive
            sym = DIRECTIVES.TO_SYMBOL[DIRECTIVES.FORMAT];
            split = (this.func || this.key).split(sym);
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
                if(this.func) {
                    this.func = split[0];
                } else {
                    this.key = split[0];
                }
            }
            // escape directive
            sym = DIRECTIVES.TO_SYMBOL[DIRECTIVES.ESCAPE];
            split = this.func || this.key;
            if(split.endsWith(sym)) {
                this.escape = true;
                split = split.slice(0,-1);
                if(this.func) {
                    this.func = split;
                } else {
                    this.key = split;
                }
            }
            if(this.format.endsWith(sym)) {
                this.escape = true;
                this.format = this.format.slice(0,-1);
            }
            // convert pass-to-function key to node
            if(this.func) this.func = new PassToFunctionNode(this.func, this);
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

class PassToFunctionNode extends Node {
    constructor(key, contextNode) {
        if(key instanceof PassToFunctionNode) {
            super(key.key);
            this.incontext = key.incontext;
        } else {
            super(key);
            this.incontext = false;
            // function can have context directive, but can't be pure context -- e.g. {{data~.}}
            if(this.key[0] === DIRECTIVES.TO_SYMBOL[DIRECTIVES.IN_CONTEXT]) {
                this.key = this.key.slice(1);
                this.incontext = true;
            }
            if(!this.key.length && !this.incontext) throw `Invalid tag: empty evaluation at ${contextNode.raw}`;
        }
        this._finish();
    }
};

class PartialNode extends Node {
    constructor(tag) {
        super();
        if(tag.incontext) throw `Partial tag cannot be paired with in-context directive at ${tag.raw}`;
        if(tag.format)    throw `Partial tag cannot be paired with format directive at ${tag.raw}`;
        if(tag.escape)    throw `Partial tag cannot be paired with escape directive at ${tag.raw}`;
        if(tag.func)      throw `Partial tag cannot be paired with pass-to-function directive at ${tag.raw}`;
        this.directive = DIRECTIVES.PARTIAL;
        this.raw       = tag.raw;
        this.inner     = tag.inner;
        this.key       = tag.key;
        this.incontext = true;  // partials default to in-context
        if(this.key.endsWith(DIRECTIVES.TO_SYMBOL[DIRECTIVES.ROOT_PARTIAL])) {
            this.key = this.key.slice(0,-1);
            this.incontext = false;
            if(!this.key.length) throw `Empty partial tag at ${tag.raw}`;
        }
        this._finish();
    }
};

class SectionNode extends Node {
    constructor(tag, parent) {
        super(tag.key);
        this.raw       = tag.raw;
        this.inner     = [];
        this.incontext = tag.incontext;
        this.parent    = parent;
        if(tag instanceof SectionNode) {
            this.func      = tag.func ? new PassToFunctionNode(tag.func) : null;
            this.inclusive = tag.inclusive;
            this.open      = tag.open;
            // this.close     = tag.close;
            this.list      = tag.list;
        } else {
            this.func      = tag.func;
            this.inclusive = tag.directive === DIRECTIVES.SECTION_INC || tag.directive === DIRECTIVES.LIST_SECTION;
            this.open      = tag;
            // this.close     = null;
            this.list      = tag.directive === DIRECTIVES.LIST_SECTION;
            if(tag.format) throw `Invalid tag: format passed to section tag ${tag.raw}`;
            if(tag.escape) throw `Invalid tag: escape directive passed to section tag ${tag.raw}`;
            if(tag.directive !== DIRECTIVES.SECTION_INC && tag.directive !== DIRECTIVES.SECTION_EXC && tag.directive !== DIRECTIVES.LIST_SECTION) {
                throw `Template error: parsing invalid section tag ${tag.raw}`;
            }
        }
        this._finish();
    }
}

export {Node, RootNode, TextNode, TagNode, PassToFunctionNode, PartialNode, SectionNode};