import {RootNode, TextNode, TagNode, PartialNode, SectionNode} from "./nodes.js";
import DIRECTIVES from "./directives.js";

class Tag {
    constructor(key) {
        this.key = key;
    }
}

const DEFAULT = {
    delimiters: ["{{","}}"]
};

class Template {

    constructor(template, options) {
        this.delimiters;
        this.template = template;
        this.root = new RootNode();
        this.parse((options && options.delimiters) || DEFAULT.delimiters);
    }

    parse(delimiters) {
        this.delimiters = [...delimiters];
        let search  = 0, 
            open    = -1, 
            start   = -1, 
            close   = -1, 
            current = this.root, 
            nest    = 0, 
            raw, 
            node;
        while(true) {
            // find opening delimiter
            open = this.indexOf(delimiters[0], search);
            if(!~open) break;
            start = open + delimiters[0].length;
            // find closing delimiter
            close = this.indexOf(delimiters[1], start);
            if(!~close) break;
            // grab preceding content
            if(open && open > search) {
                current.inner.push(new TextNode(this.template.slice(search, open)));
            }
            search = close + delimiters[1].length;
            // create node and handle by case
            node = new TagNode(
                this.template.slice(open, search), 
                this.template.slice(start, close).trim()
            );
            switch(node.directive) {
                // ignore comments
                case DIRECTIVES.COMMENT:
                    break;
                // convert partials
                case DIRECTIVES.PARTIAL:
                    node = new PartialNode(node);
                    current.inner.push(node);
                    break;
                // handle sections
                case DIRECTIVES.SECTION_END:
                    if(current instanceof RootNode) throw `Invalid template: unpaired section close at ${node.raw}`;
                    if(current.open.key !== node.key) throw `Invalid template: Invalid template: section conflict at ${node.raw} close before inner ${current.start.raw} closed`;
                    //current.close = node;
                    current = current.parent;
                    --nest;
                    break;
                case DIRECTIVES.SECTION_INC:
                case DIRECTIVES.SECTION_EXC:
                    let section = new SectionNode(node, current);
                    current.inner.push(section);
                    current = section;
                    ++nest;
                    break;
                // all others check if in context
                default:
                    if(!node.incontext) {
                        
                    }
                    current.inner.push(node);
                    break;
            }
        }
        // push last text
        if(search < this.template.length) {
            current.inner.push(new TextNode(this.template.slice(search, this.template.length)));
        }
        // final error check
        if(current !== this.root) throw `Invalid template: hanging open section for ${current.start.raw}`;
    }

    indexOf(search, indexStart) {
        let index = this.template.indexOf(search, indexStart || 0);
        // ignores escaped
        while(index > 0 && this.template[index-1] === "!") {
            index = this.template.indexOf(search, index+search.length);
        }
        return index;
    }


};


export default Template;