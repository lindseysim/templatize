import * as d3 from "d3-format";

export default {
    findTag(content, delimiters, tag, options) {
        options = options || {};
        let as      = options.as || false, 
            search  = options.search || 0, 
            split   = options.split || [], 
            closing = options.closing || false;
        if(split && !Array.isArray(split)) split = [split];
        let open = this.__findTag(content, delimiters, tag, as, split, search);
        if(!closing || !open) return open;
        let close = this.__findTag(content, delimiters, tag, "/", null, open.end);
        if(!close) return null;
        return {
            open:  open, 
            close: close, 
            inner: content.slice(open.end, close.start)
        }
    }, 
    __findTag(content, delimiters, tag, as, split, search) {
        search = search || 0;
        let open       = -1, 
            start      = -1, 
            close      = -1, 
            directives = [], 
            inner;
        // find opening tag
        while(true) {
            // find opening delimiter
            open = this.indexOf(content, delimiters[0], search);
            if(!~open) return null;
            start = open+delimiters[0].length;
            // find closing delimiter
            close = this.indexOf(content, delimiters[1], search);;
            if(!~close) return null;
            // update position and grab content
            search = close + delimiters[1].length;
            inner = content.slice(start, close).trim();
            // as directive, if specified
            if(as) {
                if(inner[0] != as) continue;
                inner = inner.slice(1);
            }
            // split by directives, if specified
            if(split && split.length) {
                inner = [inner];
                split.forEach(s => {
                    let len = inner.length;
                    if(len > 1) {
                        --len;
                        inner = inner.slice(0, len).concat(inner[len].split(s));
                    } else {
                        inner = inner[0].split(s);
                    }
                });
                if(inner.length > 1) directives = inner.slice(1);
                inner = inner[0];
            }
            if(tag === undefined || inner === tag) {
                return {
                    start: open, 
                    end: search, 
                    directives: directives
                };
            }
        }
    }, 
    indexOf(html, search, indexStart) {
        let index = html.indexOf(search, indexStart || 0);
        // ignores escaped
        while(index > 0 && html[index-1] === "!") {
            index = html.indexOf(search, index+search.length);
        }
        return index;
    },
    format(value, format) {
        if(value === null || value === undefined) return "";
        value = value.toString();
        if(!format) return value;
        if(!isNaN(value) && !isNaN(parseFloat(value))) {
            return d3.format(format)(value);
        }
        if(format.startsWith("^")) {
            value = this.escape(value);
            format = format.slice(1);
        }
        switch(format) {
            case "encode":
                return this.escape(value);
            case "upper":
                return value.toUpperCase();
            case "lower":
                return value.toLowerCase();
            case "capitalize":
                return value.replace(/(?:^|[^\w])[a-z]/g, match => {
                    return match === "'s" ? match : match.toUpperCase();
                });
        }
        return value;
    }, 
    escape(value) {
        return value.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};