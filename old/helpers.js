import * as d3 from "d3-format";

export default {
    findTag(content, delimiters, tag, options) {
        return this.__findTag(content, delimiters, tag, options);
        if(!closing) return open;
    }, 
    findSection(content, delimiters, tag, options) {
        // copy options so we don't modified source obj
        if(!options || !options.as || !options.as.length) throw "Opening section tag must have leading directive";
        let optOpen = {}, optClose = {};
        for(let key in options) {
            if(key === "split") throw "Section tags cannot have trailing directives";
            optOpen[key] = options[key];
            optClose[key] = key === "as" ? "/" : options[key];
        }
        // find opening tag
        let open = this.findTag(content, delimiters, tag, optOpen), 
            close;
        // find closing tag
        close = this.__findTag(content, delimiters, tag, optClose);
        if(!open && !close) return null;
        if(!open || close.start < open.start) throw `Improper section nesting (for: #${tag})`;
        // section object
        function newSection(open, parent) {
            return {
                open:  open, 
                close: null, 
                as:    open.as, 
                nest:  [], 
                inner: [], 
                _up:   parent
            };
        }
        // parse for possible nested structure
        let current = newSection(open), 
            root = current, 
            next, 
            i = 0;
        optOpen.search = current.open.end;
        while(++i) {
            if(i > 100) throw `Section search call stack size exceeded (for: #${tag})`;
            // find all nested opening tag
            next = this.__findTag(content, delimiters, tag, optOpen);
            // continue pushing to inner level if still can
            if(next && next.start < close.start) {
                current.nest.push(newSection(next, current));
                current = current.nest[current.nest.length-1];
                optOpen.search = current.open.end;
                continue;
            }
            // at inner-most, unhandled tag, close tag
            current.close = close;
            // parse inner content, exclude whatever nested
            if(!current.nest.length) {
                current.inner = [content.slice(current.open.end, current.close.start)];
            } else {
                let sliceFrom = current.open.end;
                current.inner = [];
                current.nest.forEach((child,i) => {
                    current.inner.push(content.slice(sliceFrom, child.open.start));
                    sliceFrom = child.close.end;
                });
                current.inner.push(content.slice(sliceFrom, current.close.start));
            }
            if(current._up) {
                // find next closing tag
                optClose.search = current.close.end;
                close = this.__findTag(content, delimiters, tag, optClose);
                if(!close) throw `Improper section nesting (for: #${tag})`;
                // pop level, cleanup "up" reference
                next = current;
                current = current._up;
                delete next._up;
            } else {
                // break condition
                delete current._up;
                break;
            }
        }
        return root;
    }, 
    __findTag(content, delimiters, tag, options) {
        options    = options || {};
        let as     = options.as || false, 
            split  = options.split || false, 
            search = options.search || 0;
        if(as && !Array.isArray(as)) as = [as];
        if(split && !Array.isArray(split)) split = [split];
        let open       = -1, 
            start      = -1, 
            close      = -1, 
            directives = [], 
            asIndex, inner;
        // find opening tag
        while(true) {
            // find opening delimiter
            open = this.indexOf(content, delimiters[0], search);
            if(!~open) return null;
            start = open+delimiters[0].length;
            // find closing delimiter
            close = this.indexOf(content, delimiters[1], search);
            if(!~close) return null;
            // update position and grab content
            search = close + delimiters[1].length;
            inner = content.slice(start, close).trim();
            // verify as directive, if specified
            asIndex = -1;
            if(as) {
                asIndex = as.indexOf(inner[0])
                if(!~asIndex) continue;
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
                    as: ~asIndex ? as[asIndex] : undefined, 
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