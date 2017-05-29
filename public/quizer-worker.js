(function () {
    onmessage = messageHandler;
    freezeSelf();
    return; // only function definitions follow
    function messageHandler(event) {
        const request = event.data;
        const consoleWrapper = {
            log: (...args) => console.log.apply(console, args),
        };
        for (let testIndex = 0; testIndex < request.tests.length; testIndex++) {
            const test = request.tests[testIndex];
            let lineCounter = 0;
            const readline = () => {
                return test.input[lineCounter++];
            };
            let output = [];
            const writeline = (...args) => {
                output.push(args ? args.join("") : "");
            };
            let error = null;
            const selfValues = captureSelf();
            try {
                execute(request.code, consoleWrapper, readline, writeline);
                if (output.length < test.output.length)
                    error = "The output is missing lines";
                else if (output.length > test.output.length)
                    error = "The output has too many lines";
                else {
                    for (let i = 0; i < output.length; i++) {
                        if (output[i] !== test.output[i]) {
                            error = `Output line ${i + 1} is not correct.\nExpected '${test.output[i]}'\nGot '${output[i]}'`;
                            break;
                        }
                    }
                }
            }
            catch (e) {
                error = e.message;
                if (e.stack) {
                    const m = e.stack.match(/<anonymous>:(\d+):(\d+)/);
                    if (m) {
                        error = `<a class="error-pos" data-line="${m[1]}" data-col="${m[2]}">Line ${m[1]}, column ${m[2]}</a>: ${e.message}`;
                    }
                }
            }
            finally {
                restoreSelf(selfValues);
            }
            if (error) {
                postMessage({ pass: false, error: `Test #${testIndex}: ${error}` });
                return;
            }
        }
        postMessage({ pass: true });
    }
    ;
    function freezeSelf() {
        const s = self;
        const allowedKeys = [
            "Math", "Infinity", "console", "self", "Array", "ArrayBuffer", "Boolean", "Date", "Error",
            "Float32Array", "Float64Array", "FormData", "ImageBitmap", "ImageData",
            "Int8Array", "Int16Array", "Int32Array", "JSON", "Map", "NaN", "Number", "Object",
            "Promise", "Proxy", "Reflect", "RegExp", "Set", "String", "Symbol",
            "Uint8Array", "Uint8ClampedArray", "Uint16Array", "Uint32Array", "WeakMap", "WeakSet",
            "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "eval",
            "isFinite", "isNaN", "parseFloat", "parseInt", "undefined", "unescape",
            "onmessage", "postMessage"
        ];
        for (const key of Object.getOwnPropertyNames(s)) {
            const isAllowed = allowedKeys.indexOf(key) > -1;
            const value = s[key];
            if (!isAllowed) {
                delete s[key];
            }
            freezeObjectDeep(value);
        }
    }
    function freezeObjectDeep(obj, alreadyVisited = []) {
        if (obj instanceof Object && alreadyVisited.indexOf(obj) === -1) {
            alreadyVisited.push(obj);
            Object.freeze(obj);
            for (const k of getAllPropertyNames(obj)) {
                try {
                    freezeObjectDeep(obj[k], alreadyVisited);
                }
                catch (e) {
                }
            }
        }
    }
    function getAllPropertyNames(obj) {
        if (obj == null) {
            return [];
        }
        const keys = Object.getOwnPropertyNames(obj);
        const symbols = Object.getOwnPropertySymbols(obj);
        const proto = Object.getPrototypeOf(obj);
        return keys.concat(symbols).concat(getAllPropertyNames(proto));
    }
    function captureSelf() {
        const s = {};
        for (const key of getAllPropertyNames(self)) {
            s[key] = self[key];
        }
        return s;
    }
    function restoreSelf(values) {
        for (const key of getAllPropertyNames(self)) {
            const valueBefore = values[key];
            const valueNow = self[key];
            if (valueBefore === valueNow) {
                continue;
            }
            if (valueBefore === void 0) {
                delete self[key];
                continue;
            }
            try {
                self[key] = valueBefore;
            }
            catch (e) {
                console.warn(`Cannot restore the value of global '${key}'.`);
            }
        }
    }
    function execute(code, console, readline, writeline) {
        const onmessage = null;
        const postMessage = null;
        const self = null;
        eval(code);
    }
})();
