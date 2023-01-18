import Interface from "./lib/interface.js";
import Template from "./lib/template.js";

export default {
    render: function(template, bindings, options) {
        return this.from(template, options).render(bindings);
    }, 
    from: function(template, options) {
        return new Interface(new Template(template, options), options);
    }
};