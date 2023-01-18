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
    ROOT_PARTIAL: "^",  // dup of SECTION_EXC, but differs by being suffix
    IN_CONTEXT:   ".", 
    PASS_CONTEXT: "->", 
    FORMAT:       "::", 
    ESCAPE:       ";"
}
let i = 0;
for(let name in SYMBOLS) {
    DIRECTIVES[name] = ++i;
    DIRECTIVES.TO_SYMBOL[i] = SYMBOLS[name];
    if(name !== "ROOT_PARTIAL") {
        DIRECTIVES.TO_VALUE[SYMBOLS[name]] = i;
    }
}
export default DIRECTIVES;