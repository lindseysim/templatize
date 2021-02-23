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
        let template = this.template, 
            last     = 0, 
            search   = 0, 
            open     = -1, 
            start    = -1, 
            close    = -1, 
            current  = this.root, 
            nest     = 0, 
            raw, node;
        while(true) {
            // find opening delimiter
            open = template.indexOf(delimiters[0], search);
            if(!~open) break;
            start = open + delimiters[0].length;
            // find closing delimiter
            close = template.indexOf(delimiters[1], search);
            if(!~close) break;
            // update search position
            search = close + delimiters[1].length;
            // ignore escaped (remove directive character in template)
            if(template[open-1] === "!") {
                template = template.slice(0, open-1) + template.slice(open);
                search -= 1;
                continue;
            }
            // grab preceding content
            if(open && open > last) {
                current.inner.push(new TextNode(template.slice(last, open)));
            }
            last = search;
            // create node and handle
            node = new TagNode(
                template.slice(open, search), 
                template.slice(start, close).trim()
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
        if(last < template.length) {
            current.inner.push(new TextNode(template.slice(search, template.length)));
        }
        // final error check
        if(current !== this.root) throw `Invalid template: hanging open section for ${current.start.raw}`;
    }


};


export default Template;