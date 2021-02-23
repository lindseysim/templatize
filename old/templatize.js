import Interface from "./interface.js";

const Templatize = {};
Interface.call(Templatize);

Templatize.custom = options => {
    var inst = {};
    Interface.call(inst, options);
    return inst;
};

export default Templatize;