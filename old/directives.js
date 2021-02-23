const DIRECTIVES = {_SYMBOLS: {}};
let SYMBOLS = {
    COMMENT:      "!", 
    LIST:         "&", 
    SECTION_INC:  "#", 
    SECTION_EXC:  "^", 
    SECTION_END:  "/", 
    PASS_CONTEXT: "~", 
    FORMAT:       "::"
}
let i = 0;
for(let name in SYMBOLS) {
    DIRECTIVES[name] = ++i;
    DIRECTIVES._SYMBOLS[i] = SYMBOLS[name];
}
export default DIRECTIVES;