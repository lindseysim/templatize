(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Templatize"] = factory();
	else
		root["Templatize"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ templatize)
});

;// CONCATENATED MODULE: ./lib/directives.js
var DIRECTIVES = {
  TO_SYMBOL: {},
  TO_VALUE: {}
};
var SYMBOLS = {
  COMMENT: "!",
  LIST: "&",
  LIST_SECTION: "&#",
  PASS_SECTION: "#->",
  SECTION_INC: "#",
  SECTION_EXC: "^",
  SECTION_END: "/",
  PARTIAL: ">",
  IN_CONTEXT: ".",
  PASS_CONTEXT: "->",
  FORMAT: "::",
  ESCAPE: ";"
};
var i = 0;
for (var directives_name in SYMBOLS) {
  DIRECTIVES[directives_name] = ++i;
  DIRECTIVES.TO_SYMBOL[i] = SYMBOLS[directives_name];
  DIRECTIVES.TO_VALUE[SYMBOLS[directives_name]] = i;
}
/* harmony default export */ const directives = (DIRECTIVES);
;// CONCATENATED MODULE: ./lib/nodes.js
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); Object.defineProperty(subClass, "prototype", { writable: false }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function isDirective(directive, slice) {
  var sym = directives.TO_SYMBOL[directive];
  if (sym && this.key.slice(0, sym.length) === sym) {
    if (slice) this.key = this.key.slice(sym.length);
    return true;
  }
  return false;
}
function parseFormatDirectives() {
  var sym = directives.TO_SYMBOL[directives.FORMAT],
    split = this.key.split(sym);
  // leading or ending with format directive, assume part of name
  if (split.length === 2) {
    if (!split[0] && !this.incontext) {
      split = [split[1]];
    } else if (!split[1]) {
      split = [split[0]];
    }
  }
  if (split.length > 1) {
    if (split.length > 2) {
      throw "Invalid tag: multiple format directives at ".concat(this.raw);
    }
    if (!split[0] && !this.incontext || !split[1] || split[1][0] === sym[0]) {
      throw "Invalid tag: malformatted format directive at ".concat(this.raw);
    }
    this.format = split[1];
    this.key = split[0];
  }
  // escape directive
  sym = directives.TO_SYMBOL[directives.ESCAPE];
  split = this.key;
  if (split.endsWith(sym)) {
    this.escape = true;
    split = split.slice(0, -sym.length);
    this.key = split;
  }
  if (this.format.endsWith(sym)) {
    this.escape = true;
    this.format = this.format.slice(0, -sym.length);
  }
}

// basic node type
var Node = /*#__PURE__*/function () {
  function Node(key) {
    _classCallCheck(this, Node);
    this.key = key || ""; // data key of tag
    this.keysplit = []; // data key split by nested separators
  }
  _createClass(Node, [{
    key: "_finish",
    value: function _finish() {
      this.keysplit = this.key.split(".");
    }
  }]);
  return Node;
}(); // root processing node, has no function except to nest nodes within
var RootNode = /*#__PURE__*/function (_Node) {
  _inherits(RootNode, _Node);
  var _super = _createSuper(RootNode);
  function RootNode() {
    var _this;
    _classCallCheck(this, RootNode);
    _this = _super.call(this);
    _this.inner = []; // list of nested nodes
    return _this;
  }
  return _createClass(RootNode);
}(Node); // node representing raw text (for both template and rendered)
var TextNode = /*#__PURE__*/function (_Node2) {
  _inherits(TextNode, _Node2);
  var _super2 = _createSuper(TextNode);
  function TextNode(text) {
    var _this2;
    _classCallCheck(this, TextNode);
    _this2 = _super2.call(this);
    _this2.text = text; // text node is just the string content
    return _this2;
  }
  return _createClass(TextNode);
}(Node); // node representing a tag, both in the template and left as-is for basic tags
var TagNode = /*#__PURE__*/function (_Node3) {
  _inherits(TagNode, _Node3);
  var _super3 = _createSuper(TagNode);
  function TagNode(raw, inner) {
    var _this3;
    _classCallCheck(this, TagNode);
    _this3 = _super3.call(this);
    _this3.raw = raw.trim(); // raw tag string (including delimiters)
    _this3.tagstr = inner.trim(); // tag string (trimming delimiters and whitespace)
    _this3.directive = 0; // primary tag type (of all major tag-type directives)
    _this3.incontext = false; // if bound to data within context
    _this3.key = ""; // data key of tag
    _this3.func = []; // if pass to function(s), linked to nodes for function keys
    _this3.format = ""; // formatting directive
    _this3.escape = false; // short-hand escape HTML format directive (suffix ";")
    // ignore empties (by marking as comment)
    if (!_this3.tagstr.length) {
      _this3.directive = directives.COMMENT;
    } else {
      _this3.key = _this3.tagstr;
      // first handle multi-character and other special directives
      if (isDirective.call(_assertThisInitialized(_this3), directives.LIST_SECTION, true)) {
        // special case of list and section
        _this3.directive = directives.LIST_SECTION;
      } else if (isDirective.call(_assertThisInitialized(_this3), directives.PASS_SECTION, true)) {
        // special case of section pass as context
        _this3.directive = directives.PASS_SECTION;
      } else {
        // match against single-character directives
        _this3.directive = directives.TO_VALUE[_this3.key[0]];
        // special-case handling
        switch (_this3.directive) {
          case null:
          case undefined: // no match
          case directives.IN_CONTEXT: // handled separately as can be doubled-up behind directive
          case directives.PASS_CONTEXT: // here and below are not leading directives
          case directives.FORMAT:
          case directives.ESCAPE:
            _this3.directive = 0;
            break;
          case directives.ROOT_PARTIAL:
            // this one doubles as exclusive section so special case
            _this3.directive = directives.SECTION_EXC;
          default:
            _this3.key = _this3.key.slice(directives.TO_SYMBOL[_this3.directive].length);
        }
      }
      // in-context-directive
      if (isDirective.call(_assertThisInitialized(_this3), directives.IN_CONTEXT, true)) {
        _this3.incontext = true;
      }
      // pass-as-context directive
      var sym = directives.TO_SYMBOL[directives.PASS_CONTEXT],
        split = _this3.key.split(sym);
      // note pure context tag {{.}} can be split with empty first {{.~tofunc}}
      if (split.length > 1) {
        _this3.key = split[0];
        if (!_this3.key && !_this3.incontext) {
          throw "Invalid tag: malformatted function context directive at ".concat(_this3.raw);
        }
        _this3.func = split.slice(1).map(function (fn) {
          return fn.trim();
        });
        _this3.func.forEach(function (fn) {
          if (!fn || fn.length >= sym.length && fn.slice(0, sym.length) === sym[0]) {
            throw "Invalid tag: malformatted pass-to-function at ".concat(_this3.raw);
          }
        });
      }
      // format directive
      parseFormatDirectives.call(_assertThisInitialized(_this3));
      // convert pass-to-function key to node
      _this3.func = _this3.func.map(function (fn) {
        return new PassToFunctionNode(fn, _assertThisInitialized(_this3));
      });
    }
    // final key check
    _this3.key = _this3.key.trim();
    if (!_this3.key.length && !_this3.incontext) {
      // can't be empty except special case for pure context {{.}}
      throw "Invalid tag: empty evaluation at ".concat(_this3.raw);
    }
    // this fills keysplit
    _this3._finish();
    return _this3;
  }
  return _createClass(TagNode);
}(Node);
;

// node representing the separated function in a pass-context-to-function tag
var PassToFunctionNode = /*#__PURE__*/function (_Node4) {
  _inherits(PassToFunctionNode, _Node4);
  var _super4 = _createSuper(PassToFunctionNode);
  function PassToFunctionNode(key, contextNode) {
    var _this4;
    _classCallCheck(this, PassToFunctionNode);
    if (key instanceof PassToFunctionNode) {
      // copy only
      _this4 = _super4.call(this, key.key);
      _this4.format = key.format;
      _this4.escape = key.escape;
      _this4.incontext = key.incontext;
    } else {
      _this4 = _super4.call(this, key);
      _this4.format = "";
      _this4.escape = false;
      _this4.incontext = false;
      // function can have context directive, but can't be pure context -- e.g. {{data~.}}
      if (_this4.key[0] === directives.TO_SYMBOL[directives.IN_CONTEXT]) {
        _this4.key = _this4.key.slice(directives.TO_SYMBOL[directives.IN_CONTEXT].length);
        _this4.incontext = true;
      }
      if (!_this4.key.length && !_this4.incontext) throw "Invalid tag: empty evaluation at ".concat(contextNode.raw);
      // format directive
      parseFormatDirectives.call(_assertThisInitialized(_this4));
    }
    _this4._finish();
    return _possibleConstructorReturn(_this4);
  }
  return _createClass(PassToFunctionNode);
}(Node);
;

// node representing a partial, build off the TagNode it came from
var PartialNode = /*#__PURE__*/function (_Node5) {
  _inherits(PartialNode, _Node5);
  var _super5 = _createSuper(PartialNode);
  function PartialNode(tag) {
    var _this5;
    _classCallCheck(this, PartialNode);
    if (tag instanceof SectionNode) throw "Partial tag cannot be used as section at ".concat(tag.raw);
    if (tag.func.length) throw "Partial tag cannot be paired with pass-to-function directive at ".concat(tag.raw);
    _this5 = _super5.call(this, tag.key);
    _this5.raw = tag.raw;
    _this5.directive = directives.PARTIAL;
    _this5.tag = tag;
    _this5.incontext = tag.incontext;
    _this5.format = tag.format;
    _this5.escape = tag.escape;
    _this5._finish();
    return _this5;
  }
  return _createClass(PartialNode);
}(Node);
;

// node representing a section, build off the TagNode it came from
var SectionNode = /*#__PURE__*/function (_Node6) {
  _inherits(SectionNode, _Node6);
  var _super6 = _createSuper(SectionNode);
  function SectionNode(tag, parent) {
    var _this6;
    _classCallCheck(this, SectionNode);
    _this6 = _super6.call(this, tag.key);
    _this6.raw = tag.raw;
    _this6.directive = tag.directive;
    _this6.tag = tag; // link to tag node from when parsed in template
    _this6.inner = []; // list of nested nodes within section
    _this6.incontext = tag.incontext; // if bound to data within context
    _this6.parent = parent; // link to parent section node (or root node if not nested)
    if (tag instanceof SectionNode) {
      _this6.open = tag.open; // link to open tag instance (link to close tag not needed)
      _this6.list = tag.list; // is section list
      _this6.inclusive = tag.inclusive; // inclusive or exclusive type
      _this6.passcontext = tag.passcontext; // is section passed as context
      // if pass to function, linked to node for function key
      _this6.func = tag.func;
    } else {
      _this6.open = tag;
      _this6.inclusive = tag.directive !== directives.SECTION_EXC;
      _this6.list = _this6.inclusive && tag.directive === directives.LIST_SECTION;
      _this6.passcontext = _this6.inclusive && !_this6.list && tag.directive === directives.PASS_SECTION;
      _this6.func = !_this6.passcontext ? tag.func : [new PassToFunctionNode(tag.key, tag)];
      if (tag.format) throw "Invalid tag: format passed to section tag ".concat(tag.raw);
      if (tag.escape) throw "Invalid tag: escape directive passed to section tag ".concat(tag.raw);
      if (_this6.inclusive && !_this6.list && !_this6.passcontext && tag.directive !== directives.SECTION_INC) {
        throw "Template error: parsing invalid section tag ".concat(tag.raw);
      }
    }
    _this6._finish();
    return _this6;
  }
  return _createClass(SectionNode);
}(Node);

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
function misc_typeof(obj) { "@babel/helpers - typeof"; return misc_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, misc_typeof(obj); }

var OVERFLOW = 99;
var TYPES = {
  UNDEFINED: -1,
  NULL: 0,
  VALUE: 1,
  STRING: 1,
  NUMBER: 1,
  ARRAY: 2,
  OBJECT: 3,
  FUNCTION: 4
};
function typeOf(value) {
  switch (value) {
    case undefined:
      return TYPES.UNDEFINED;
    case null:
      return TYPES.NULL;
  }
  if (Array.isArray(value)) return TYPES.ARRAY;
  switch (misc_typeof(value)) {
    case "object":
      return TYPES.OBJECT;
    case "function":
      return TYPES.FUNCTION;
  }
  return TYPES.VALUE;
}
;
function evalf(func, context, root, handleException) {
  context = context || {};
  try {
    var value = func,
      i = 0;
    while (typeof value === "function") {
      if (++i >= OVERFLOW) break;
      value = value.call(context, root);
    }
    return value;
  } catch (e) {
    if (handleException) {
      return handleException(e);
    } else {
      throw e;
    }
  }
}
;
function formatValue(value, format, escapehtml) {
  if (!value && value !== 0) return "";
  value = value.toString();
  if (format) {
    switch (format) {
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
        value = value.replace(/(?:^|[^\w])[a-z]/g, function (match) {
          return match === "'s" ? match : match.toUpperCase();
        });
        break;
      default:
        try {
          value = defaultLocale_format(format)(value);
        } catch (e) {
          console.error("Render error: unrecognized/bad format value \"".concat(format, "\""));
        }
    }
  }
  if (escapehtml) {
    value = value.replaceAll(/&/g, "&amp;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;").replaceAll(/"/g, "&quot;").replaceAll(/'/g, "&#039;");
  }
  return value;
}
;

;// CONCATENATED MODULE: ./lib/template.js
function template_typeof(obj) { "@babel/helpers - typeof"; return template_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, template_typeof(obj); }
function template_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, template_toPropertyKey(descriptor.key), descriptor); } }
function template_createClass(Constructor, protoProps, staticProps) { if (protoProps) template_defineProperties(Constructor.prototype, protoProps); if (staticProps) template_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function template_toPropertyKey(arg) { var key = template_toPrimitive(arg, "string"); return template_typeof(key) === "symbol" ? key : String(key); }
function template_toPrimitive(input, hint) { if (template_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (template_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function template_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }


var DEFAULT = {
  delimiters: ["{{", "}}"]
};
var Template = /*#__PURE__*/template_createClass(function Template(template, options) {
  template_classCallCheck(this, Template);
  this.root = new RootNode();
  var delimiters = options && options.delimiters || DEFAULT.delimiters,
    last = 0,
    search = 0,
    open = -1,
    start = -1,
    close = -1,
    current = this.root,
    nest = 0,
    raw,
    node;
  while (true) {
    // find opening delimiter
    open = template.indexOf(delimiters[0], search);
    if (!~open) break;
    start = open + delimiters[0].length;
    // find closing delimiter
    close = template.indexOf(delimiters[1], search);
    if (!~close) break;
    // update search position
    search = close + delimiters[1].length;
    // ignore escaped (remove directive character in template)
    if (template[open - 1] === "!") {
      template = template.slice(0, open - 1) + template.slice(open);
      search -= 1;
      continue;
    }
    // grab preceding content
    if (open && open > last) {
      current.inner.push(new TextNode(template.slice(last, open)));
    }
    last = search;
    // create node and handle
    node = new TagNode(template.slice(open, search), template.slice(start, close).trim());
    switch (node.directive) {
      // ignore comments
      case directives.COMMENT:
        break;
      // handle sections
      case directives.SECTION_END:
        if (current instanceof RootNode) throw "Invalid template: unpaired section close at ".concat(node.raw);
        if (current.open.key !== node.key) throw "Invalid template: Invalid template: section conflict at ".concat(node.raw, " close before inner ").concat(current.open.raw, " closed");
        // closing tags don't need to be stored, just unnest
        current = current.parent;
        --nest;
        break;
      case directives.PASS_SECTION:
      case directives.LIST_SECTION:
      case directives.SECTION_INC:
      case directives.SECTION_EXC:
        var section = new SectionNode(node, current);
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
  if (last < template.length) {
    current.inner.push(new TextNode(template.slice(search, template.length)));
  }
  // final error check
  if (current !== this.root) throw "Invalid template: hanging open section for ".concat(current.open.raw);
});
;
/* harmony default export */ const lib_template = (Template);
;// CONCATENATED MODULE: ./lib/domain.js
function domain_typeof(obj) { "@babel/helpers - typeof"; return domain_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, domain_typeof(obj); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function domain_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function domain_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, domain_toPropertyKey(descriptor.key), descriptor); } }
function domain_createClass(Constructor, protoProps, staticProps) { if (protoProps) domain_defineProperties(Constructor.prototype, protoProps); if (staticProps) domain_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function domain_toPropertyKey(arg) { var key = domain_toPrimitive(arg, "string"); return domain_typeof(key) === "symbol" ? key : String(key); }
function domain_toPrimitive(input, hint) { if (domain_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (domain_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }


var Domain = /*#__PURE__*/function () {
  function Domain(data, fullkey, parent) {
    domain_classCallCheck(this, Domain);
    this.fullkey = fullkey || "";
    this.prefix = this.fullkey ? this.fullkey + "." : this.fullkey;
    this.prefixlen = this.prefix.split(".").length - 1;
    this.data = data;
    this["function"] = null;
    this.type = typeOf(this.data);
    this.parent = parent || null;
    this.root = this.parent && this.parent.root || this;
    this.cache = parent && parent.cache || {};
    this.children = {
      ".": this
    };
    this.isrepeating = false;
    this.dynamic = {
      children: {},
      length: this.lengthDynamic.bind(this),
      'get': this.getDynamic.bind(this),
      create: this.createDynamic.bind(this)
    };
    switch (this.type) {
      // function store reference to function, data is f() output but resolved whenever first called
      case TYPES.FUNCTION:
        this["function"] = this.data;
        this.data = null;
        break;
      // dynamic data that changes based on context (e.g. an array where items iterated with same tags)
      case TYPES.ARRAY:
        this.isrepeating = true;
        break;
    }
  }
  domain_createClass(Domain, [{
    key: "reroot",
    value: function reroot() {
      return new Domain(this.data);
    }
  }, {
    key: "_eval",
    value: function _eval(onFuncError) {
      if (this["function"] && !this.data) {
        this.data = evalf(this["function"], this.parent.data, this.root.data, onFuncError);
        this.type = typeOf(this.data);
        if (this.type === TYPES.ARRAY) {
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
  }, {
    key: "value",
    value: function value(onFuncError) {
      return this._eval(onFuncError);
    }

    /* 
     * Get child data domain / subcontext. If function and first time, evaluates function till non-function 
     * type and changes type. If called in dynamic domain, return null.
     */
  }, {
    key: "get",
    value: function get(key, onFuncError, skipCache) {
      var fullkey;
      if (key && key !== ".") {
        fullkey = this.prefix + key;
      } else {
        fullkey = this.fullkey;
        key = ".";
      }
      // functions render on first handle to resolve what data is
      this._eval(onFuncError);
      // check cache
      if (!skipCache && fullkey in this.cache) return this.cache[fullkey];
      // can't normal 'get' children of repeating sections (use getDynamic)
      if (this.isrepeating) return null;
      // get context or create if not yet existing
      if (key in this.children) return this.children[key];
      if (!(key in this.data)) return null;
      var subcontext = new Domain(this.data[key], fullkey, this);
      this.children[key] = this.cache[fullkey] = subcontext;
      return subcontext;
    }

    /* 
     * Get dynamic length.
     */
  }, {
    key: "lengthDynamic",
    value: function lengthDynamic() {
      switch (this.type) {
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
  }, {
    key: "createDynamic",
    value: function createDynamic(dkey, withData, index) {
      var dykey = "{".concat(index || 0).concat(dkey ? "->" : "").concat(dkey, "}");
      if (dykey in this.dynamic.children) return this.dynamic.children[dykey];
      var context = new Domain(withData, this.fullkey, this.parent);
      context.cache = {}; // disconnect cache for dynamic contexts
      this.dynamic.children[dykey] = context;
      return context;
    }

    /*
     * Get dynamic data domain by index. Used for repeating sections to dynamically load the domain of an 
     * array item. If not an array-type, simply loads the current data.
     */
  }, {
    key: "getDynamic",
    value: function getDynamic(index, onFuncError) {
      var data = this.isrepeating ? this.data[index] : this._eval(onFuncError);
      return this.createDynamic("", data, index);
    }

    /* 
     * Check if node is in this context (lazy search, doesn't check if most specific).
     */
  }, {
    key: "incontext",
    value: function incontext(fullKeyOrNode) {
      var key = fullKeyOrNode;
      if (fullKeyOrNode instanceof Node) {
        if (fullKeyOrNode.incontext) return true;
        key = fullKeyOrNode.key;
      }
      return key === this.fullkey || key.startsWith(this.prefix);
    }

    /* 
     * Search for domain.
     */
  }, {
    key: "_search",
    value: function _search(fullkey, keysplit, onFuncError, bubble, atstart) {
      // if start of search, try cache
      if (atstart && fullkey in this.cache) return this.cache[fullkey];
      // if exactly at, return self
      if (!keysplit.length || this.fullkey === fullkey) return this;
      if (bubble) {
        // reverse search condition when in context or at root (can always bubble out of dynamic domain)
        if (!this.parent) {
          return this._search(fullkey, keysplit, onFuncError);
        } else if (this.incontext(fullkey)) {
          // remove incontext prefix from fullkey before searching inside
          var rmlen = -1;
          while (keysplit.length && ++rmlen < this.prefixlen) {
            keysplit.shift();
          }
          return this._search(fullkey, keysplit, onFuncError);
        }
        // continue bubbling (if exiting dynamic, reset 'atstart' to try parent's cache)
        return this.parent._search(fullkey, keysplit, onFuncError, true, this.isrepeating);
      }
      // to handle names with periods in them (user-error by try to work with), append key parts till match
      var subcontext,
        key = "";
      for (var k = 0; k < keysplit.length; ++k) {
        key += keysplit[k];
        subcontext = this.get(key, onFuncError, true);
        if (subcontext) {
          if (subcontext === this) return this; // special case when key="."
          return subcontext._search(fullkey, keysplit.slice(k + 1), onFuncError);
        }
        key += ".";
      }
      return keysplit.length ? null : this;
    }
  }, {
    key: "search",
    value: function search(node, onFuncError) {
      // special case for naked context tags
      if (!node.key && node.incontext) return this;
      // try cache with full keys (note in-context nodes skip bubble)
      return this._search(node.key, _toConsumableArray(node.keysplit), onFuncError, !node.incontext, true);
    }
  }]);
  return Domain;
}();
/* harmony default export */ const domain = (Domain);
;// CONCATENATED MODULE: ./lib/context.js
function context_typeof(obj) { "@babel/helpers - typeof"; return context_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, context_typeof(obj); }
function context_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function context_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, context_toPropertyKey(descriptor.key), descriptor); } }
function context_createClass(Constructor, protoProps, staticProps) { if (protoProps) context_defineProperties(Constructor.prototype, protoProps); if (staticProps) context_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function context_toPropertyKey(arg) { var key = context_toPrimitive(arg, "string"); return context_typeof(key) === "symbol" ? key : String(key); }
function context_toPrimitive(input, hint) { if (context_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (context_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }


var Context = /*#__PURE__*/function () {
  function Context(node, domain, dynamics, onFuncError) {
    var _this = this;
    context_classCallCheck(this, Context);
    this._onError = onFuncError;
    this.node = node; // node tied to this context
    this.isdynamic = false; // dynamic domains are those that are ephemeral in domain tree -- e.g. 
    // context passed to function or repeating sections
    this.isresolved = false; // if not resolved, this.value is a function to resolve
    this.isrepeating = false; // if domain for repeating section
    this.length = 0; // length of dynamic domains to be handled in same context
    this.domain = null; // the corresponding data domain for the node
    this.func = []; // corresponding data domains for any pass-to-function(s)
    this.value = undefined; // the final data value (or function if unresolved)

    // get domain of node, checking dynamic contexts and then the provided domain
    var findDomain = function findDomain(searchNode, atDomain) {
      if (!searchNode.incontext && dynamics && dynamics.length) {
        for (var d = dynamics.length - 1; d >= 0; --d) {
          if (dynamics[d].incontext(searchNode.key)) {
            return dynamics[d].search(searchNode, _this._onError);
          }
        }
      }
      return atDomain.search(searchNode, _this._onError);
    };
    this.domain = findDomain(this.node, domain, dynamics);
    // if domain can't be found -- which might be to dynamic domains not yet populated enough
    if (!this.domain) return;
    if (this.node.func.length) {
      // node is dynamic as function(s) output depend on context, get domains of function(s)
      this.isdynamic = true;
      this.func = this.node.func.map(function (fn) {
        return findDomain(fn, domain);
      });
      if (~this.func.findIndex(function (fdom) {
        return !fdom;
      })) throw "Context passed to unresolved function at ".concat(this.node.raw);
      if (~this.func.findIndex(function (fdom) {
        return !fdom["function"];
      })) throw "Context passed to non-function at ".concat(this.node.raw);
    }
  }
  context_createClass(Context, [{
    key: "_resolveFuncs",
    value: function _resolveFuncs(value, rootDomain) {
      var _this2 = this;
      this.func.forEach(function (fdom, i) {
        value = evalf(fdom["function"], value, rootDomain, _this2._onError);
        var fnode = _this2.node.func[i];
        if (fnode.format || fnode.escape) {
          value = formatValue(value, fnode.format, fnode.escape);
        }
      });
      return value;
    }
  }, {
    key: "resolve",
    value: function resolve(root) {
      var _this3 = this;
      if (this.isresolved || this.value !== undefined) return;
      // if not pass-to-function(s), simply resolve value from domain, only dynamic possibility is repeating
      // sections
      if (!this.node.func.length) {
        this.value = this.domain.value(this._onError);
        this.isresolved = true;
        this.isdynamic = this.isrepeating = this.domain.isrepeating;
        this.length = this.domain.dynamic.length();
        this._onError = null; // reference no longer needed
        return;
      }
      // functions are passed root data context as parameter
      var rootDomain = root && root.data || {};
      if (this.node instanceof SectionNode && this.node.passcontext) {
        // node is pass-section-as-context, context is unresolved as need to render section text first
        // value becomes unresolved function with context as argument
        this.value = function (context) {
          return _this3._resolveFuncs(context || _this3.domain.value(_this3._onError), rootDomain);
        };
      } else {
        // resolve value by passing context to function(s)
        this.value = this.domain.value(this._onError);
        if (this.node.format || this.node.escape) {
          this.value = formatValue(this.value, this.node.format, this.node.escape);
        }
        this.value = this._resolveFuncs(this.value, rootDomain);
        this.isresolved = true;
        // repeating section may result
        if (Array.isArray(this.value)) {
          this.isrepeating = true;
          this.length = this.value.length;
        }
      }
      this._onError = null; // reference no longer needed
    }
  }, {
    key: "toDynamicDomain",
    value: function toDynamicDomain() {
      if (!this.isresolved && !this.value) {
        throw "Attempting to create a dynamic domain from unresolved context.";
      }
      // if no reason to by dynamic, return domain as-is
      if (this.isrepeating && !this.func.length || !this.isdynamic) return this.domain;
      // cycle through function(s), appending function-name-chain for dynamic key-name
      var fnchain = "";
      this.func.forEach(function (fdom, i) {
        fnchain += "".concat(i && "->" || "").concat(fdom.fullkey, "()");
      });
      return this.domain.dynamic.create(fnchain, this.value);
    }
  }]);
  return Context;
}();
/* harmony default export */ const context = (Context);
;// CONCATENATED MODULE: ./lib/interface.js
function interface_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function interface_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, interface_toPropertyKey(descriptor.key), descriptor); } }
function interface_createClass(Constructor, protoProps, staticProps) { if (protoProps) interface_defineProperties(Constructor.prototype, protoProps); if (staticProps) interface_defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function interface_toPropertyKey(arg) { var key = interface_toPrimitive(arg, "string"); return interface_typeof(key) === "symbol" ? key : String(key); }
function interface_toPrimitive(input, hint) { if (interface_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (interface_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function interface_typeof(obj) { "@babel/helpers - typeof"; return interface_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, interface_typeof(obj); }






var interface_DEFAULT = {
  errorOnFuncFailure: false,
  evalZeroAsTrue: false,
  escapeAll: false,
  errorOnMissingTags: false
};
function loadPartials(given, delimiters) {
  if (!given) return {};
  var imported = {},
    options = delimiters && {
      delimiters: delimiters
    };
  for (var pkey in given) {
    if (typeof given[pkey] === "string") {
      try {
        imported[pkey] = new lib_template(given[pkey], options);
      } catch (e) {
        console.error("Invalid partial template for '".concat(pkey, "'"));
        throw e;
      }
    } else if (given[pkey] instanceof lib_template) {
      imported[pkey] = given[pkey];
    } else {
      throw "Invalid partial: must be instance of Template or template string ('".concat(pkey, "' is ").concat(interface_typeof(given[pkey]), ")");
    }
  }
  return imported;
}
var Interface = /*#__PURE__*/function () {
  function Interface(template, options) {
    interface_classCallCheck(this, Interface);
    options = options || {};
    this._errorOnFuncFailure = options.errorOnFuncFailure || interface_DEFAULT.errorOnFuncFailure;
    this._evalZeroAsTrue = options.evalZeroAsTrue || interface_DEFAULT.evalZeroAsTrue;
    this._escapeAll = options.escapeAll || interface_DEFAULT.escapeAll;
    this._errorOnMissingTags = options.errorOnMissingTags || interface_DEFAULT.errorOnMissingTags;
    this._template = template;
    this._root = null;
    this._ogPartials = loadPartials(options.partials, options.delimiters);
    this._partials = {};
    this._options = {};
    this._errorHandler = null;
  }
  interface_createClass(Interface, [{
    key: "errorOnFuncFailure",
    get: function get() {
      return 'errorOnFuncFailure' in this._options ? this._options.errorOnFuncFailure : this._errorOnFuncFailure;
    },
    set: function set(to) {
      if (typeof to !== "undefined") this._errorOnFuncFailure = Boolean(to);
    }
  }, {
    key: "evalZeroAsTrue",
    get: function get() {
      return 'evalZeroAsTrue' in this._options ? this._options.evalZeroAsTrue : this._evalZeroAsTrue;
    },
    set: function set(to) {
      if (typeof to !== "undefined") this._evalZeroAsTrue = Boolean(to);
    }
  }, {
    key: "escapeAll",
    get: function get() {
      return 'escapeAll' in this._options ? this._options.escapeAll : this._escapeAll;
    },
    set: function set(to) {
      if (typeof to !== "undefined") this._escapeAll = Boolean(to);
    }
  }, {
    key: "errorOnMissingTags",
    get: function get() {
      return 'errorOnMissingTags' in this._options ? this._options.errorOnMissingTags : this._errorOnMissingTags;
    },
    set: function set(to) {
      if (typeof to !== "undefined") this._errorOnMissingTags = Boolean(to);
    }
  }, {
    key: "_missingHandler",
    value: function _missingHandler(key, throwError) {
      if (throwError || this._errorOnMissingTags) {
        throw "Render error: missing binding for '".concat(key, "'");
      }
      ;
      return "";
    }
  }, {
    key: "render",
    value: function render(bindings, options) {
      options = options || {};
      this._options = {
        errorOnFuncFailure: options.errorOnFuncFailure === undefined ? this.errorOnFuncFailure : options.errorOnFuncFailure,
        evalZeroAsTrue: options.evalZeroAsTrue === undefined ? this.evalZeroAsTrue : options.evalZeroAsTrue,
        escapeAll: options.escapeAll === undefined ? this.escapeAll : options.escapeAll,
        errorOnMissingTags: options.errorOnMissingTags === undefined ? this.errorOnMissingTags : options.errorOnMissingTags
      };
      this._errorHandler = function (throwError) {
        return function (key) {
          return function (exception) {
            if (throwError) throw exception;
            console.error("Error evaluating bindings at ".concat(key));
            console.error(exception);
            return "";
          };
        };
      }(this._errorOnFuncFailure);
      try {
        if (bindings instanceof domain) {
          this._root = bindings.reroot();
        } else {
          this._root = new domain(bindings);
        }

        // map partials, convert to interface
        this._partials = {};
        for (var pkey in this._ogPartials) {
          this._partials[pkey] = this._ogPartials[pkey];
        }
        var addPartials = loadPartials(options.partials, options.delimiters);
        for (var _pkey in addPartials) {
          this._partials[_pkey] = addPartials[_pkey];
        }
        for (var _pkey2 in this._partials) {
          this._partials[_pkey2] = new Interface(this._partials[_pkey2], this._options);
        }
        return this._renderInsideOut(this._renderOutsideIn(this._template.root));
      } finally {
        // clean up references and temporary variables
        //if(this._root) this._root.cleanup();
        this._root = null;
        this._partials = {};
        this._options = {};
      }
    }
  }, {
    key: "_getContext",
    value: function _getContext(node, domain, dynamics) {
      var result = new context(node, domain, dynamics, this._errorHandler(node.raw));
      if (!result.domain) return null;
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
  }, {
    key: "_renderOutsideIn",
    value: function _renderOutsideIn(root, domain, processed, unresolved) {
      domain = domain || this._root;
      processed = processed || new RootNode();
      unresolved = unresolved || [];
      var node, context, forSection, checkNode, cantResolve, processSection;
      for (var n = 0; n < root.inner.length; ++n) {
        node = root.inner[n];

        // skip comments (shouldn't exist but just in case)
        if (node.directive === directives.COMMENT) continue;

        // text doesn't need processing
        if (node instanceof TextNode) {
          processed.inner.push(node);
          continue;
        }

        // render partial as sub-render with passed data domain and duplicate options
        if (node instanceof PartialNode) {
          processed.inner.push(this._partial(node, domain));
          continue;
        }

        // can't resolve node in-context tied to a repeating section
        if (domain.isrepeating && node.incontext) {
          processed.inner.push(node);
          continue;
        }
        forSection = node instanceof SectionNode;

        // additional unresolved checks against unresolvable nodes
        checkNode = !forSection && node.directive !== directives.LIST;
        if (unresolved.length && (checkNode || node.func.length)) {
          cantResolve = unresolved.find(function (urdom) {
            return (
              // can't resolve node (excluding sections and lists -- handled separately)
              checkNode && urdom.incontext(node.key)
              // can't resolve a passed-to function
              || node.func.find(function (fn) {
                return urdom.incontext(fn.key);
              })
            );
          });
          if (cantResolve) {
            processed.inner.push(node);
            continue;
          }
        }

        // get data context -- if null, likely due to nesting into dynamic data, so defer processing
        context = this._getContext(node, domain);
        if (!context) {
          processed.inner.push(node);
          continue;
        }

        // render sections -- handler split out for readability, but from there can recurse back into 
        // this function
        if (forSection) {
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
  }, {
    key: "_renderInsideOut",
    value: function _renderInsideOut(root, domain, dynamics) {
      var _this = this;
      domain = domain || this._root;
      dynamics = dynamics || [];
      var node,
        context,
        useDomain,
        dydom,
        processed = [],
        rendered;
      root.inner.forEach(function (node) {
        // only handle sections for this first outside-in loop
        if (!(node instanceof SectionNode)) {
          processed.push(node);
          return;
        }

        // get context, missing here is either skip or exception thrown
        context = _this._getContext(node, domain, dynamics);
        if (!context) {
          _this._missingHandler(node.raw);
          return;
        }

        // get domain for remaining node cases
        // if section-pass-as-context, use current domain, as isn't a real subdomain
        // otherwise, is repeating section or dynamic, convert context to dynamic domain
        useDomain = node.passcontext ? domain : context.toDynamicDomain();

        // pass section as context, render node to text, then finally pass to unresolved context function
        if (node.passcontext && !context.isresolved) {
          rendered = _this._renderInsideOut(node, useDomain, dynamics);
          processed.push(context.value(rendered));
          return;
        }

        // standard section bound to context within a dynamic data domain
        if (!context.isrepeating) {
          if (_this._display(node.inclusive, useDomain)) {
            processed.push(_this._renderInsideOut(node, useDomain, dynamics));
          }
          return;
        }

        // only thing left is repeating sections
        var pieces = [];
        for (var i = 0; i < context.length; ++i) {
          dydom = useDomain.dynamic.get(i);
          dynamics.push(dydom);
          if (_this._display(true, dydom)) {
            pieces.push(_this._renderInsideOut(node, dydom, dynamics));
          }
          dynamics.pop();
        }
        // either just add nodes to processed or convert to grammatic list
        if (!node.list) {
          processed = processed.concat(pieces);
        } else {
          switch (pieces.length) {
            case 0:
              break;
            case 1:
              processed.push(pieces[0]);
              break;
            case 2:
              processed.push("".concat(pieces[0], " and ").concat(pieces[1]));
              break;
            default:
              var last = pieces.pop();
              processed.push(pieces.join(", ") + ", and ".concat(last));
              break;
          }
        }
      });

      // this part will run from inner-most out on all remaining nodes
      var text = "";
      processed.forEach(function (node) {
        if (node instanceof TextNode) {
          text += node.text;
        } else if (typeof node === "string") {
          text += node;
        } else {
          context = _this._getContext(node, domain, dynamics);
          if (!context) {
            text += _this._missingHandler(node.raw);
          } else {
            text += _this._renderValue(node, context.value);
          }
        }
      });
      return text;
    }
  }, {
    key: "_section",
    value: function _section(node, context, processed, unresolved) {
      // Repeating sections and as-context sections (i.e. pass section as context) recurse inner content to 
      // process any non-dynamic referencing tags, but also add node to processing array for final 
      // processing in inside-out rendering.
      if (context.isrepeating || node.passcontext) {
        if (node.inclusive && (node.passcontext || context.length)) {
          // Copy section node and replace any in-context shortcuts with full path as it will be handled
          // later, potentially out of context.
          var dynode = new SectionNode(node);
          if (dynode.incontext) {
            dynode.key = context.domain.fullkey;
            dynode.incontext = false;
            dynode._finish();
          }
          dynode.func.forEach(function (fn, i) {
            if (!fn.incontext) return;
            fn.key = context.func[i].fullkey;
            fn.incontext = false;
            fn._finish();
          });
          var _domain = context.toDynamicDomain();
          // Add to unresolved domains, recurse, pop unresolved domain, add to processing
          unresolved.push(_domain);
          this._renderOutsideIn(node, _domain, dynode, unresolved);
          unresolved.pop();
          processed.inner.push(dynode);
        }
        return;
      }
      // Standard sections (or skip if not displayed)
      var domain = context.toDynamicDomain();
      if (this._display(node.inclusive, domain)) {
        // copy and insert empty section node to preserve context/nesting hierarchy on normal sections
        var processSection = new SectionNode(node);
        processed.inner.push(processSection);
        // recurse back into outside-in rendering for section
        this._renderOutsideIn(node, domain, processSection, unresolved);
      }
    }
  }, {
    key: "_display",
    value: function _display(inclusive, domain) {
      var display = domain.value();
      switch (domain.type) {
        case TYPES.OBJECT:
          var _display = domain.get("_display");
          if (_display) return _display.value();
          break;
        // Should only occur in edge case with multi-dimensional arrays in repeating section render as any
        // repeating section tag (which hinges display on array length) checks this separately. See above 
        // in _section(). Thus commented out.
        // case TYPES.ARRAY:
        //     break;
        default:
          switch (interface_typeof(display)) {
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
  }, {
    key: "_partial",
    value: function _partial(node, context) {
      if (!this._partials[node.key]) {
        if (this.errorOnMissingTags) throw "Render error: missing partial for ".concat(node.key);
        console.warn("Render error: missing partial for ".concat(node.key));
        return "";
      }
      try {
        return this._renderValue(node, this._partials[node.key].render(node.incontext ? context : this._root, this._options));
      } catch (e) {
        console.log("Partial render error for '".concat(node.raw, "'"));
        console.warn(e);
        return "";
      }
    }
  }, {
    key: "_renderValue",
    value: function _renderValue(node, value) {
      // if functions exist (as pass-as-context node), formatting will be applied during context evaluation
      var hasfuncs = node.func && node.func.length,
        format = !hasfuncs && node.format,
        escape = this._escapeAll || !hasfuncs && node.escape,
        type = typeOf(value);
      if (type <= TYPES.NULL) return "";
      // format list (unless not array, then normal handling)
      if (node.directive === directives.LIST && type === TYPES.ARRAY) {
        value = value.map(function (vi) {
          // multi-dimensional arrays simply converted to string
          if (Array.isArray(vi)) return "[".concat(vi.toString(), "]");
          return formatValue(vi, format, escape);
        });
        switch (value.length) {
          case 0:
            return "";
          case 1:
            return value[0];
          case 2:
            return "".concat(value[0], " and ").concat(value[1]);
          default:
            var last = value.pop();
            return value.join(", ") + ", and ".concat(last);
        }
      }
      // other non-value types, convert to string
      switch (type) {
        case TYPES.ARRAY:
          value = "[".concat(value.toString(), "]");
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
  }]);
  return Interface;
}();
;
/* harmony default export */ const lib_interface = (Interface);
;// CONCATENATED MODULE: ./templatize.js


/* harmony default export */ const templatize = ({
  render: function render(template, bindings, options) {
    return this.from(template, options).render(bindings);
  },
  from: function from(template, options) {
    return new lib_interface(new lib_template(template, options), options);
  }
});
__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});