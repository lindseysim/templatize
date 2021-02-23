const overflow = 32;

var eval(func, context, handleException) {
    context = context || {};
    try {
        let value = func, 
            i     = 0;
        while(typeof value === "function") {
            if(++i >= overflow) break;
            value = func.call(context);
        }
        return value;
    } catch(e) {
        if(handleException) {
            return handleException(e);
        } else {
            throw e;
        }
        return "";
        if(i >= _overflow) throw `Function overflow at: ${node.raw}`;
        console.error(`Function call error at: ${node.raw}`);
        if(throwEx) throw e;
        console.error(e);
        return "";
    }
    handleException(null, true);
};

export default eval;