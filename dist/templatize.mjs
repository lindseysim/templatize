/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "Z": () => (/* binding */ templatize)
});

;// CONCATENATED MODULE: ./lib/directives.js
const DIRECTIVES = {
    TO_SYMBOL: {}, 
    TO_VALUE: {}
};
let SYMBOLS = {
    COMMENT:      "!", 
    LIST:         "&", 
    LIST_SECTION: "&#", 
    PASS_SECTION: "#->", 
    SECTION_INC:  "#", 
    SECTION_EXC:  "^", 
    SECTION_END:  "/", 
    PARTIAL:      ">", 
    IN_CONTEXT:   ".", 
    PASS_CONTEXT: "->", 
    FORMAT:       "::", 
    ESCAPE:       ";"
}
let i = 0;
for(let name in SYMBOLS) {
    DIRECTIVES[name] = ++i;
    DIRECTIVES.TO_SYMBOL[i] = SYMBOLS[name];
    DIRECTIVES.TO_VALUE[SYMBOLS[name]] = i;
}
/* harmony default export */ const directives = (DIRECTIVES);
;// CONCATENATED MODULE: ./lib/nodes.js



function isDirective(directive, slice) {
    let sym = directives.TO_SYMBOL[directive];
    if(sym && this.key.slice(0, sym.length) === sym) {
        if(slice) this.key = this.key.slice(sym.length);
        return true;
    }
    return false;
}


function parseFormatDirectives() {
    let sym = directives.TO_SYMBOL[directives.FORMAT], 
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
    sym = directives.TO_SYMBOL[directives.ESCAPE];
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
            this.directive = directives.COMMENT;
        } else {
            this.key = this.tagstr;
            // first handle multi-character and other special directives
            if(isDirective.call(this, directives.LIST_SECTION, true)) {
                // special case of list and section
                this.directive = directives.LIST_SECTION;
            } else if(isDirective.call(this, directives.PASS_SECTION, true)) {
                // special case of section pass as context
                this.directive = directives.PASS_SECTION;
            } else {
                // match against single-character directives
                this.directive = directives.TO_VALUE[this.key[0]];
                // special-case handling
                switch(this.directive) {
                    case null:
                    case undefined:                // no match
                    case directives.IN_CONTEXT:    // handled separately as can be doubled-up behind directive
                    case directives.PASS_CONTEXT:  // here and below are not leading directives
                    case directives.FORMAT:
                    case directives.ESCAPE:
                        this.directive = 0;
                        break;
                    case directives.ROOT_PARTIAL:  // this one doubles as exclusive section so special case
                        this.directive = directives.SECTION_EXC;
                    default:
                        this.key = this.key.slice(directives.TO_SYMBOL[this.directive].length);
                }
            }
            // in-context-directive
            if(isDirective.call(this, directives.IN_CONTEXT, true)) {
                this.incontext = true;
            }
            // pass-as-context directive
            let sym = directives.TO_SYMBOL[directives.PASS_CONTEXT], 
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
            if(this.key[0] === directives.TO_SYMBOL[directives.IN_CONTEXT]) {
                this.key = this.key.slice(directives.TO_SYMBOL[directives.IN_CONTEXT].length);
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
        this.directive = directives.PARTIAL;
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
            this.inclusive   = tag.directive !== directives.SECTION_EXC;
            this.list        = this.inclusive && tag.directive === directives.LIST_SECTION;
            this.passcontext = this.inclusive && !this.list && tag.directive === directives.PASS_SECTION;
            this.func        = !this.passcontext ? tag.func : [new PassToFunctionNode(tag.key, tag)];
            if(tag.format) throw `Invalid tag: format passed to section tag ${tag.raw}`;
            if(tag.escape) throw `Invalid tag: escape directive passed to section tag ${tag.raw}`;
            if(this.inclusive && !this.list && !this.passcontext && tag.directive !== directives.SECTION_INC) {
                throw `Template error: parsing invalid section tag ${tag.raw}`;
            }
        }
        this._finish();
    }
}


;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatDecimal.js
/* harmony default export */ function formatDecimal(x) {
  return Math.abs(x = Math.round(x)) >= 1e21
      ? x.toLocaleString("en").replace(/,/g, "")
      : x.toString(10);
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimalParts(1.23) returns ["123", 0].
function formatDecimalParts(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/exponent.js


/* harmony default export */ function exponent(x) {
  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatGroup.js
/* harmony default export */ function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatNumerals.js
/* harmony default export */ function formatNumerals(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatSpecifier.js
// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
  this.align = specifier.align === undefined ? ">" : specifier.align + "";
  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === undefined ? undefined : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === undefined ? "" : specifier.type + "";
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width === undefined ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
      + (this.trim ? "~" : "")
      + this.type;
};

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatTrim.js
// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
/* harmony default export */ function formatTrim(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatPrefixAuto.js


var prefixExponent;

/* harmony default export */ function formatPrefixAuto(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatRounded.js


/* harmony default export */ function formatRounded(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/formatTypes.js




/* harmony default export */ const formatTypes = ({
  "%": (x, p) => (x * 100).toFixed(p),
  "b": (x) => Math.round(x).toString(2),
  "c": (x) => x + "",
  "d": formatDecimal,
  "e": (x, p) => x.toExponential(p),
  "f": (x, p) => x.toFixed(p),
  "g": (x, p) => x.toPrecision(p),
  "o": (x) => Math.round(x).toString(8),
  "p": (x, p) => formatRounded(x * 100, p),
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": (x) => Math.round(x).toString(16).toUpperCase(),
  "x": (x) => Math.round(x).toString(16)
});

;// CONCATENATED MODULE: ./node_modules/d3-format/src/identity.js
/* harmony default export */ function identity(x) {
  return x;
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/locale.js









var map = Array.prototype.map,
    prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

/* harmony default export */ function locale(locale) {
  var group = locale.grouping === undefined || locale.thousands === undefined ? identity : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
      numerals = locale.numerals === undefined ? identity : formatNumerals(map.call(locale.numerals, String)),
      percent = locale.percent === undefined ? "%" : locale.percent + "",
      minus = locale.minus === undefined ? "−" : locale.minus + "",
      nan = locale.nan === undefined ? "NaN" : locale.nan + "";

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        trim = specifier.trim,
        type = specifier.type;

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // The "" type, and any invalid type, is an alias for ".12~g".
    else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision === undefined ? 6
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Determine the sign. -0 is not less than 0, but 1 / -0 is!
        var valueNegative = value < 0 || 1 / value < 0;

        // Perform the initial formatting.
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

        // Trim insignificant zeros.
        if (trim) value = formatTrim(value);

        // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": value = valuePrefix + value + valueSuffix + padding; break;
        case "=": value = valuePrefix + padding + value + valueSuffix; break;
        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
        default: value = padding + valuePrefix + value + valueSuffix; break;
      }

      return numerals(value);
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

;// CONCATENATED MODULE: ./node_modules/d3-format/src/defaultLocale.js


var defaultLocale_locale;
var defaultLocale_format;
var formatPrefix;

defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  defaultLocale_locale = locale(definition);
  defaultLocale_format = defaultLocale_locale.format;
  formatPrefix = defaultLocale_locale.formatPrefix;
  return defaultLocale_locale;
}

;// CONCATENATED MODULE: ./lib/misc.js


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
                    value = defaultLocale_format(format)(value);
                } catch(e) {
                    console.error(`Render error: unrecognized/bad format value "${format}"`);
                }
        }
    }
    if(escapehtml) {
        value = value.replaceAll(/&/g, "&amp;")
            .replaceAll(/</g, "&lt;")
            .replaceAll(/>/g, "&gt;")
            .replaceAll(/"/g, "&quot;")
            .replaceAll(/'/g, "&#039;");
    }
    return value;
};


;// CONCATENATED MODULE: ./lib/template.js



const DEFAULT = {delimiters: ["{{","}}"]};

class Template {
    constructor(template, options) {
        this.root      = new RootNode();
        let delimiters = (options && options.delimiters) || DEFAULT.delimiters, 
            last       = 0, 
            search     = 0, 
            open       = -1, 
            start      = -1, 
            close      = -1, 
            current    = this.root, 
            nest       = 0, 
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
                case directives.COMMENT:
                    break;
                // handle sections
                case directives.SECTION_END:
                    if(current instanceof RootNode) throw `Invalid template: unpaired section close at ${node.raw}`;
                    if(current.open.key !== node.key) throw `Invalid template: Invalid template: section conflict at ${node.raw} close before inner ${current.open.raw} closed`;
                    // closing tags don't need to be stored, just unnest
                    current = current.parent;
                    --nest;
                    break;
                case directives.PASS_SECTION:
                case directives.LIST_SECTION:
                case directives.SECTION_INC:
                case directives.SECTION_EXC:
                    let section = new SectionNode(node, current);
                    current.inner.push(section);
                    current = section;
                    ++nest;
                    break;
                // convert partials
                case directives.PARTIAL:
                    node = new PartialNode(node);
                // add partials and all others
                default:
                    current.inner.push(node);
                    break;
            }
        }
        // push last text
        if(last < template.length) {
            current.inner.push(new TextNode(template.slice(search, template.length)));
        }
        // final error check
        if(current !== this.root) throw `Invalid template: hanging open section for ${current.open.raw}`;
    }
};


/* harmony default export */ const lib_template = (Template);
;// CONCATENATED MODULE: ./lib/domain.js



class Domain {

    constructor(data, fullkey, parent) {
        this.fullkey       = fullkey || "";
        this.prefix        = this.fullkey ? this.fullkey + "." : this.fullkey;
        this.prefixlen     = this.prefix.split(".").length - 1
        this.data          = data;
        this.function      = null;
        this.type          = typeOf(this.data);
        this.parent        = parent || null;
        this.root          = this.parent && this.parent.root || this;
        this.cache         = parent && parent.cache || {};
        this.children      = {".": this};
        this.isrepeating   = false;
        this.dynamic       = {
            children: {}, 
            length:   this.lengthDynamic.bind(this), 
            'get':    this.getDynamic.bind(this), 
            create:   this.createDynamic.bind(this)
        };
        switch(this.type) {
            // function store reference to function, data is f() output but resolved whenever first called
            case TYPES.FUNCTION:
                this.function = this.data;
                this.data = null;
                break;
            // dynamic data that changes based on context (e.g. an array where items iterated with same tags)
            case TYPES.ARRAY:
                this.isrepeating = true;
                break;
        }
    }

    reroot() {
        return new Domain(this.data);
    }

    _eval(onFuncError) {
        if(this.function && !this.data) {
            this.data = evalf(this.function, this.parent.data, this.root.data, onFuncError);
            this.type = typeOf(this.data);
            if(this.type === TYPES.ARRAY) {
                this.isrepeating = true;
            } else {
                this.cache[this.fullkey] = this;
            }
        }
        return this.data;
    }

    /* 
     * Get raw value (assumed called when already in inner-most context). For functions uses evaluated value.
     */
    value(onFuncError) {
        return this._eval(onFuncError);
    }

    /* 
     * Get child data domain / subcontext. If function and first time, evaluates function till non-function 
     * type and changes type. If called in dynamic domain, return null.
     */
    get(key, onFuncError, skipCache) {
        let fullkey;
        if(key && key !== ".") {
            fullkey = this.prefix + key;
        } else {
            fullkey = this.fullkey;
            key = ".";
        }
        // functions render on first handle to resolve what data is
        this._eval(onFuncError);
        // check cache
        if(!skipCache && fullkey in this.cache) return this.cache[fullkey];
        // can't normal 'get' children of repeating sections (use getDynamic)
        if(this.isrepeating) return null;
        // get context or create if not yet existing
        if(key in this.children) return this.children[key];
        if(!(key in this.data)) return null;
        var subcontext = new Domain(this.data[key], fullkey, this);
        this.children[key] = this.cache[fullkey] = subcontext;
        return subcontext;
    }

    /* 
     * Get dynamic length.
     */
    lengthDynamic() {
        switch(this.type) {
            case TYPES.NULL:
            case TYPES.UNDEFINED:
                return 0;
            case TYPES.ARRAY:
                return this.data.length;
            default:
                return 1;
        }
    }

    /*
     * Get dynamic data domain with custom data. Must also supply unique key modifier.
     * 
     * Dynamic data domain acts as if in the same location as this domain (with same key and parent), but with
     * dynamic data that is different. Note that if search up to parent and back down, however, it cannot be 
     * re-found with same key. It is technically stored as a dynamic child of this domain.
     */
    createDynamic(dkey, withData, index) {
        var dykey =`{${index || 0}${dkey ? "->" : ""}${dkey}}`;
        if(dykey in this.dynamic.children) return this.dynamic.children[dykey];
        var context = new Domain(withData, this.fullkey, this.parent);
        context.cache = {};  // disconnect cache for dynamic contexts
        this.dynamic.children[dykey] = context;
        return context;
    }

    /*
     * Get dynamic data domain by index. Used for repeating sections to dynamically load the domain of an 
     * array item. If not an array-type, simply loads the current data.
     */
    getDynamic(index, onFuncError) {
        var data = this.isrepeating ? this.data[index] : this._eval(onFuncError);
        return this.createDynamic("", data, index);
    }

    /* 
     * Check if node is in this context (lazy search, doesn't check if most specific).
     */
    incontext(fullKeyOrNode) {
        let key = fullKeyOrNode;
        if(fullKeyOrNode instanceof Node) {
            if(fullKeyOrNode.incontext) return true;
            key = fullKeyOrNode.key;
        }
        return key === this.fullkey || key.startsWith(this.prefix);
    }

    /* 
     * Search for domain.
     */
    _search(fullkey, keysplit, onFuncError, bubble, atstart) {
        // if start of search, try cache
        if(atstart && fullkey in this.cache) return this.cache[fullkey];
        // if exactly at, return self
        if(!keysplit.length || this.fullkey === fullkey) return this;
        if(bubble) {
            // reverse search condition when in context or at root (can always bubble out of dynamic domain)
            if(!this.parent) {
                return this._search(fullkey, keysplit, onFuncError);
            } else if(this.incontext(fullkey)) {
                // remove incontext prefix from fullkey before searching inside
                let rmlen = -1;
                while(keysplit.length && ++rmlen < this.prefixlen) {
                    keysplit.shift();
                }
                return this._search(fullkey, keysplit, onFuncError);
            }
            // continue bubbling (if exiting dynamic, reset 'atstart' to try parent's cache)
            return this.parent._search(fullkey, keysplit, onFuncError, true, this.isrepeating);
        }
        // to handle names with periods in them (user-error by try to work with), append key parts till match
        let subcontext, key = "";
        for(let k = 0; k < keysplit.length; ++k) {
            key += keysplit[k];
            subcontext = this.get(key, onFuncError, true);
            if(subcontext) {
                if(subcontext === this) return this;  // special case when key="."
                return subcontext._search(fullkey, keysplit.slice(k+1), onFuncError);
            }
            key += ".";
        }
        return keysplit.length ? null : this;
    }
    search(node, onFuncError) {
        // special case for naked context tags
        if(!node.key && node.incontext) return this;
        // try cache with full keys (note in-context nodes skip bubble)
        return this._search(node.key, [...node.keysplit], onFuncError, !node.incontext, true);
    }
}

/* harmony default export */ const domain = (Domain);
;// CONCATENATED MODULE: ./lib/context.js



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
        this.func        = [];         // corresponding data domains for any pass-to-function(s)
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
            if(~this.func.findIndex(fdom => !fdom)) throw `Context passed to unresolved function at ${this.node.raw}`;
            if(~this.func.findIndex(fdom => !fdom.function)) throw `Context passed to non-function at ${this.node.raw}`;
        }
    }

    _resolveFuncs(value, rootDomain) {
        this.func.forEach((fdom, i) => {
            value = evalf(
                fdom.function, 
                value, 
                rootDomain, 
                this._onError
            );
            let fnode = this.node.func[i];
            if(fnode.format || fnode.escape) {
                value = formatValue(value, fnode.format, fnode.escape);
            }
        });
        return value;
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
        if(this.node instanceof SectionNode && this.node.passcontext) {
            // node is pass-section-as-context, context is unresolved as need to render section text first
            // value becomes unresolved function with context as argument
            this.value = context => this._resolveFuncs(
                context || this.domain.value(this._onError), 
                rootDomain
            );
        } else {
            // resolve value by passing context to function(s)
            this.value = this.domain.value(this._onError);
            if(this.node.format || this.node.escape) {
                this.value = formatValue(this.value, this.node.format, this.node.escape);
            }
            this.value = this._resolveFuncs(this.value, rootDomain);
            this.isresolved = true;
            // repeating section may result
            if(Array.isArray(this.value)) {
                this.isrepeating = true;
                this.length = this.value.length;
            }
        }
        this._onError = null; // reference no longer needed
    }

    toDynamicDomain() {
        if(!this.isresolved && !this.value) {
            throw "Attempting to create a dynamic domain from unresolved context.";
        }
        // if no reason to by dynamic, return domain as-is
        if(this.isrepeating && !this.func.length || !this.isdynamic) return this.domain;
        // cycle through function(s), appending function-name-chain for dynamic key-name
        var fnchain = "";
        this.func.forEach((fdom, i) => {
            fnchain += `${i && "->" || ""}${fdom.fullkey}()`;
        });
        return this.domain.dynamic.create(fnchain, this.value);
    }

}

/* harmony default export */ const context = (Context);
;// CONCATENATED MODULE: ./lib/interface.js







const interface_DEFAULT = {
    errorOnFuncFailure: false, 
    evalZeroAsTrue:     false, 
    escapeAll:          false, 
    errorOnMissingTags: false
};

function loadPartials(given, delimiters) {
    if(!given) return {};
    var imported = {}, 
        options = delimiters && {delimiters: delimiters};
    for(let pkey in given) {
        if(typeof given[pkey] === "string") {
            try {
                imported[pkey] = new lib_template(given[pkey], options);
            } catch(e) {
                console.error(`Invalid partial template for '${pkey}'`);
                throw e;
            }
        } else if(given[pkey] instanceof lib_template) {
            imported[pkey] = given[pkey];
        } else {
            throw `Invalid partial: must be instance of Template or template string ('${pkey}' is ${typeof given[pkey]})`;
        }
    }
    return imported;
}

class Interface {

    constructor(template, options) {
        options = options || {};
        this._errorOnFuncFailure = options.errorOnFuncFailure || interface_DEFAULT.errorOnFuncFailure;
        this._evalZeroAsTrue     = options.evalZeroAsTrue     || interface_DEFAULT.evalZeroAsTrue;
        this._escapeAll          = options.escapeAll          || interface_DEFAULT.escapeAll;
        this._errorOnMissingTags = options.errorOnMissingTags || interface_DEFAULT.errorOnMissingTags;
        this._template           = template;
        this._root               = null;
        this._ogPartials         = loadPartials(options.partials, options.delimiters);
        this._partials           = {};
        this._options            = {};
        this._errorHandler       = null;
    }

    get errorOnFuncFailure() {
        return ('errorOnFuncFailure' in this._options) ? this._options.errorOnFuncFailure : this._errorOnFuncFailure;
    }
    get evalZeroAsTrue() {
        return ('evalZeroAsTrue' in this._options)     ? this._options.evalZeroAsTrue     : this._evalZeroAsTrue;
    }
    get escapeAll() {
        return ('escapeAll' in this._options)          ? this._options.escapeAll          : this._escapeAll;
    }
    get errorOnMissingTags() {
        return ('errorOnMissingTags' in this._options) ? this._options.errorOnMissingTags : this._errorOnMissingTags;
    }
    set errorOnFuncFailure(to) { if(typeof to !== "undefined") this._errorOnFuncFailure = Boolean(to); }
    set evalZeroAsTrue(to)     { if(typeof to !== "undefined") this._evalZeroAsTrue     = Boolean(to); }
    set escapeAll(to)          { if(typeof to !== "undefined") this._escapeAll          = Boolean(to); }
    set errorOnMissingTags(to) { if(typeof to !== "undefined") this._errorOnMissingTags = Boolean(to); }

    _missingHandler(key, throwError) {
        if(throwError || this._errorOnMissingTags) {
            throw `Render error: missing binding for '${key}'`;
        };
        return "";
    }

    render(bindings, options) {
        options = options || {};
        this._options = {
            errorOnFuncFailure: options.errorOnFuncFailure === undefined ? this.errorOnFuncFailure : options.errorOnFuncFailure, 
            evalZeroAsTrue:     options.evalZeroAsTrue     === undefined ? this.evalZeroAsTrue     : options.evalZeroAsTrue, 
            escapeAll:          options.escapeAll          === undefined ? this.escapeAll          : options.escapeAll, 
            errorOnMissingTags: options.errorOnMissingTags === undefined ? this.errorOnMissingTags : options.errorOnMissingTags
        };

        this._errorHandler = (throwError => {
            return key => {
                return exception => {
                    if(throwError) throw exception;
                    console.error(`Error evaluating bindings at ${key}`);
                    console.error(exception);
                    return "";
                };
            };
        })(this._errorOnFuncFailure);

        try {
            if(bindings instanceof domain) {
                this._root = bindings.reroot();
            } else {
                this._root = new domain(bindings);
            }

            // map partials, convert to interface
            this._partials = {};
            for(let pkey in this._ogPartials) {
                this._partials[pkey] = this._ogPartials[pkey];
            }
            let addPartials = loadPartials(options.partials, options.delimiters)
            for(let pkey in addPartials) {
                this._partials[pkey] = addPartials[pkey];
            }
            for(let pkey in this._partials) {
                this._partials[pkey] = new Interface(this._partials[pkey], this._options);
            }

            return this._renderInsideOut(this._renderOutsideIn(this._template.root));

        } finally {
            // clean up references and temporary variables
            //if(this._root) this._root.cleanup();
            this._root     = null;
            this._partials = {};
            this._options  = {};
        }
    }

    _getContext(node, domain, dynamics) {
        var result = new context(node, domain, dynamics, this._errorHandler(node.raw));
        if(!result.domain) return null;
        result.resolve(this._root);
        return result;
    }

    /*
     * Rendering loop from the outside-in. Idea is to treat show/hide sections first this way to eliminate 
     * large chunks of hidden sections without wasting effort rendering what's inside.
     * 
     * Skips handling direct content for repeating sections and sections passed as context, that's handled in 
     * _renderInsideOut(). However inner content referencing bindings not for repeating data should be 
     * handled. Tricky part is managing unresolved contexts as we parse through entire template.
     *
     * @param root       - The root data domain.
     * @param domain     - The current data domain.
     * @param processed  - Array of nodes to pass to return for next round of processing.
     * @param unresolved - Array of data domains in context that are unresolved (i.e. repeating).
     */
    _renderOutsideIn(root, domain, processed, unresolved) {
        domain     = domain || this._root;
        processed  = processed || new RootNode();
        unresolved = unresolved || [];

        var node, context, forSection, checkNode, cantResolve, processSection;
        for(let n = 0; n < root.inner.length; ++n) {
            node = root.inner[n];

            // skip comments (shouldn't exist but just in case)
            if(node.directive === directives.COMMENT) continue;

            // text doesn't need processing
            if(node instanceof TextNode) {
                processed.inner.push(node);
                continue;
            }

            // render partial as sub-render with passed data domain and duplicate options
            if(node instanceof PartialNode) {
                processed.inner.push(this._partial(node, domain));
                continue;
            }

            // can't resolve node in-context tied to a repeating section
            if(domain.isrepeating && node.incontext) {
                processed.inner.push(node);
                continue;
            }

            forSection = node instanceof SectionNode;

            // additional unresolved checks against unresolvable nodes
            checkNode = !forSection && node.directive !== directives.LIST;
            if(unresolved.length && (checkNode || node.func.length)) {
                cantResolve = unresolved.find(urdom => (
                    // can't resolve node (excluding sections and lists -- handled separately)
                    checkNode && urdom.incontext(node.key)
                    // can't resolve a passed-to function
                    || node.func.find(fn => urdom.incontext(fn.key))
                ));
                if(cantResolve) {
                    processed.inner.push(node);
                    continue;
                }
            }

            // get data context -- if null, likely due to nesting into dynamic data, so defer processing
            context = this._getContext(node, domain);
            if(!context) {
                processed.inner.push(node);
                continue;
            }

            // render sections -- handler split out for readability, but from there can recurse back into 
            // this function
            if(forSection) {
                this._section(node, context, processed, unresolved);
                continue;
            }

            // render straight values unless it depends on dynamic context (those defer till 2nd round)
            processed.inner.push(this._renderValue(node, context.value));
        }

        return processed;
    }

    /*
     * Rendering loop from the inside out. Idea is to rendering repeating sections from inner-most outwards to
     * avoid as much redundancy as possible. Only remaining tags should by repeating sections, sections passed
     * as context (which needs interior rendered to text), or tags dependent on the dynamic data domain inside
     * a repeating section. So everything gets processed or is a missing data binding.
     */
    _renderInsideOut(root, domain, dynamics) {
        domain = domain || this._root;
        dynamics = dynamics || [];

        var node, context, useDomain, dydom, processed = [], rendered;
        root.inner.forEach(node => {
            // only handle sections for this first outside-in loop
            if(!(node instanceof SectionNode)) {
                processed.push(node);
                return;
            }

            // get context, missing here is either skip or exception thrown
            context = this._getContext(node, domain, dynamics);
            if(!context) {
                this._missingHandler(node.raw);
                return;
            }

            // get domain for remaining node cases
            // if section-pass-as-context, use current domain, as isn't a real subdomain
            // otherwise, is repeating section or dynamic, convert context to dynamic domain
            useDomain = node.passcontext ? domain : context.toDynamicDomain();

            // pass section as context, render node to text, then finally pass to unresolved context function
            if(node.passcontext && !context.isresolved) {
                rendered = this._renderInsideOut(node, useDomain, dynamics);
                processed.push(context.value(rendered));
                return;
            }

            // standard section bound to context within a dynamic data domain
            if(!context.isrepeating) {
                if(this._display(node.inclusive, useDomain)) {
                    processed.push(this._renderInsideOut(node, useDomain, dynamics));
                }
                return;
            }

            // only thing left is repeating sections
            var pieces = [];
            for(let i = 0; i < context.length; ++i) {
                dydom = useDomain.dynamic.get(i);
                dynamics.push(dydom);
                if(this._display(true, dydom)) {
                    pieces.push(this._renderInsideOut(node, dydom, dynamics));
                }
                dynamics.pop();
            }
            // either just add nodes to processed or convert to grammatic list
            if(!node.list) {
                processed = processed.concat(pieces);
            } else {
                switch(pieces.length) {
                    case 0:
                        break;
                    case 1:
                        processed.push(pieces[0]);
                        break;
                    case 2:
                        processed.push(`${pieces[0]} and ${pieces[1]}`);
                        break;
                    default:
                        let last = pieces.pop();
                        processed.push(pieces.join(", ") + `, and ${last}`);
                        break;
                }
            }
        });

        // this part will run from inner-most out on all remaining nodes
        var text = "";
        processed.forEach(node => {
            if(node instanceof TextNode) {
                text += node.text;
            } else if(typeof node === "string") {
                text += node;
            } else {
                context = this._getContext(node, domain, dynamics);
                if(!context) {
                    text += this._missingHandler(node.raw);
                } else {
                    text += this._renderValue(node, context.value);
                }
            }
        });
        return text;
    }

    _section(node, context, processed, unresolved) {
        // Repeating sections and as-context sections (i.e. pass section as context) recurse inner content to 
        // process any non-dynamic referencing tags, but also add node to processing array for final 
        // processing in inside-out rendering.
        if(context.isrepeating || node.passcontext) {
            if(node.inclusive && (node.passcontext || context.length)) {
                // Copy section node and replace any in-context shortcuts with full path as it will be handled
                // later, potentially out of context.
                var dynode = new SectionNode(node);
                if(dynode.incontext) {
                    dynode.key = context.domain.fullkey;
                    dynode.incontext = false;
                    dynode._finish();
                }
                dynode.func.forEach((fn, i) => {
                    if(!fn.incontext) return;
                    fn.key = context.func[i].fullkey;
                    fn.incontext = false;
                    fn._finish();
                });
                let domain = context.toDynamicDomain();
                // Add to unresolved domains, recurse, pop unresolved domain, add to processing
                unresolved.push(domain);
                this._renderOutsideIn(node, domain, dynode, unresolved);
                unresolved.pop();
                processed.inner.push(dynode);
            }
            return;
        }
        // Standard sections (or skip if not displayed)
        let domain = context.toDynamicDomain();
        if(this._display(node.inclusive, domain)) {
            // copy and insert empty section node to preserve context/nesting hierarchy on normal sections
            var processSection = new SectionNode(node);
            processed.inner.push(processSection);
            // recurse back into outside-in rendering for section
            this._renderOutsideIn(node, domain, processSection, unresolved);
        }
    }

    _display(inclusive, domain) {
        let display =  domain.value();
        switch(domain.type) {
            case TYPES.OBJECT:
                let _display = domain.get("_display");
                if(_display) return _display.value();
                break;
            // Should only occur in edge case with multi-dimensional arrays in repeating section render as any
            // repeating section tag (which hinges display on array length) checks this separately. See above 
            // in _section(). Thus commented out.
            // case TYPES.ARRAY:
            //     break;
            default:
                switch(typeof display) {
                    case "string":
                        display = display.trim();
                        break;
                    case "number":
                        display = display !== 0 ? display : this._evalZeroAsTrue;
                        break;
                }
                break;
        }
        return inclusive === Boolean(display);
    }

    _partial(node, context) {
        if(!this._partials[node.key]) {
            if(this.errorOnMissingTags) throw `Render error: missing partial for ${node.key}`;
            console.warn(`Render error: missing partial for ${node.key}`)
            return "";
        }
        try {
            return this._renderValue(
                node, 
                this._partials[node.key].render(
                    node.incontext ? context : this._root, 
                    this._options
                )
            );
        } catch(e) {
            console.log(`Partial render error for '${node.raw}'`);
            console.warn(e);
            return "";
        }
    }

    _renderValue(node, value) {
        // if functions exist (as pass-as-context node), formatting will be applied during context evaluation
        let hasfuncs = node.func && node.func.length, 
            format   = !hasfuncs && node.format, 
            escape   = this._escapeAll || (!hasfuncs && node.escape), 
            type     = typeOf(value);
        if(type <= TYPES.NULL) return "";
        // format list (unless not array, then normal handling)
        if(node.directive === directives.LIST && type === TYPES.ARRAY) {
            value = value.map(vi => {
                // multi-dimensional arrays simply converted to string
                if(Array.isArray(vi)) return `[${vi.toString()}]`;
                return formatValue(vi, format, escape);
            });
            switch(value.length) {
                case 0:
                    return "";
                case 1:
                    return value[0];
                case 2:
                    return `${value[0]} and ${value[1]}`;
                default:
                    let last = value.pop();
                    return value.join(", ") + `, and ${last}`;
            }
        }
        // other non-value types, convert to string
        switch(type) {
            case TYPES.ARRAY:
                value = `[${value.toString()}]`;
                format = false;
                break;
            case TYPES.OBJECT:
                value = JSON.stringify(value);
                format = false;
                break;
        }
        // final format and add
        return formatValue(value, format, escape);
    }

};

/* harmony default export */ const lib_interface = (Interface);
;// CONCATENATED MODULE: ./templatize.js



/* harmony default export */ const templatize = ({
    render: function(template, bindings, options) {
        return this.from(template, options).render(bindings);
    }, 
    from: function(template, options) {
        return new lib_interface(new lib_template(template, options), options);
    }
});
var __webpack_exports__default = __webpack_exports__.Z;
export { __webpack_exports__default as default };
