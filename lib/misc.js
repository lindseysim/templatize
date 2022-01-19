import * as d3 from "d3-format";

const OVERFLOW = 99;
const TYPES = {
    UNDEFINED: -1, 
    NULL:      0, 
    VALUE:     1, 
    STRING:    1, 
    NUMBER:    1, 
    ARRAY:     2, 
    OBJECT:    3, 
    FUNCTION:  4
};

function typeOf(value) {
    switch(value) {
        case undefined:
            return TYPES.UNDEFINED;
        case null:
            return TYPES.NULL;
    }
    if(Array.isArray(value)) return TYPES.ARRAY;
    switch(typeof value) {
        case "object":
            return TYPES.OBJECT;
        case "function":
            return TYPES.FUNCTION;
    }
    return TYPES.VALUE;
};

function evalf(func, context, root, handleException) {
    context = context || {};
    try {
        let value = func, 
            i     = 0;
        while(typeof value === "function") {
            if(++i >= OVERFLOW) break;
            value = value.call(context, root);
        }
        return value;
    } catch(e) {
        if(handleException) {
            return handleException(e);
        } else {
            throw e;
        }
    }
};

function formatValue(value, format, escapehtml) {
    if(!value && value !== 0) return "";
    value = value.toString();
    if(format) {
        switch(format) {
            case "raw":
            case "html":
                escapehtml = false;
                break;
            case "encode":
                escapehtml = true;
                break;
            case "allcaps":
            case "caps":
            case "upper":
                value = value.toUpperCase();
                break;
            case "lower":
                value = value.toLowerCase();
                break;
            case "capitalize":
                value = value.replace(/(?:^|[^\w])[a-z]/g, match => {
                    return match === "'s" ? match : match.toUpperCase();
                });
                break;
            default:
                try {
                    if(format) value = d3.format(format)(value);
                } catch(e) {
                    console.error(`Render error: unrecognized/bad format value "${format}"`);
                }
        }
    }
    if(escapehtml) {
        value = value.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    return value;
};

export {TYPES, typeOf, evalf, formatValue};