import Interface from "./interface.js";
import Template from "./template.js";

export default {
    render: function(template, bindings, options) {
        return this.from(template, options).render(bindings, options);
    }, 
    from: function(template, options) {
        return new Interface(new Template(template, options), options);
    }
};