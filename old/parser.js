import {NodeTag} from "./class.js"

export default {

    parse(template, delimiters) {
        let search = 0, 
            open   = -1, 
            start  = -1, 
            close  = -1, 
            pieces = [], 
            nodes  = [], 
            text, node;
        while(true) {
            // find opening delimiter
            open = this.indexOf(template, delimiters[0], search);
            if(!~open) break;
            start = open + delimiters[0].length;
            // find closing delimiter
            close = this.indexOf(template, delimiters[1], search);
            if(!~close) break;
            // grab content and node
            if(open && open > search) {
                text = pieces.push(template.slice(search, open));
            }
            node = new NodeTag(
                template.slice(start-delimiters[0].length, close+delimiters[1].length), 
                template.slice(start, close).trim()
            );
            nodes.push(node);
            pieces.push(node);
            // update position
            search = close + delimiters[1].length;
        }
        // closing piece
        if(search < template.length) {
            pieces.push(template.slice(search, template.length));
        }
        return pieces;
    }, 

    indexOf(content, search, indexStart) {
        let index = content.indexOf(search, indexStart || 0);
        // ignores escaped
        while(index > 0 && content[index-1] === "!") {
            index = content.indexOf(search, index+search.length);
        }
        return index;
    }

};