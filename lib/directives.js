const DIRECTIVES = {
    TO_SYMBOL: {}, 
    TO_VALUE: {}
};
let SYMBOLS = {
    COMMENT:      "!", 
    LIST:         "&", 
    SECTION_INC:  "#", 
    SECTION_EXC:  "^", 
    SECTION_END:  "/", 
    PARTIALS:     ">", 
    ROOT_PARTIAL: "^", 
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
export default DIRECTIVES;