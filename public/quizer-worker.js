(function (execute) {
    onmessage = messageHandler;
    freezeSelf();
    return; // only function definitions follow
    function messageHandler(event) {
        const request = event.data;
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
            let needTermination;
            const selfValues = captureSelf();
            try {
                execute(request.code, readline, writeline);
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
                        error = `[${m[1]}:${m[2]}]: ${e.message}`;
                    }
                }
            }
            finally {
                needTermination = restoreSelf(selfValues);
            }
            if (needTermination) {
                postMessage({ needTermination: true, pass: false, error: `Test #${testIndex}: found persistent global variable` });
                return;
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
            "onmessage", "postMessage", "btoa", "atob"
        ];
        for (const key of getAllPropertyNames(s)) {
            const isAllowed = allowedKeys.indexOf(key) > -1;
            const value = s[key];
            if (!isAllowed) {
                delete s[key];
                if (s[key]) {
                    try {
                        Object.defineProperty(s, key, {
                            value: void 0,
                            configurable: false,
                            writable: false,
                        });
                    }
                    catch (e) {
                    }
                    if (s[key]) {
                        console.warn("Could not delete", key, s[key]);
                    }
                }
            }
        }
        const alreadyFrozed = [self];
        for (const key of getAllPropertyNames(s)) {
            freezeObjectDeep(s[key], alreadyFrozed);
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
        delete self.onmessage;
        delete self.postMessage;
        return s;
    }
    function restoreSelf(values) {
        const s = self;
        self.onmessage = values.onmessage;
        self.postMessage = values.postMessage;
        let needTermination = false;
        let terminationMsg = "Congratulations! You almost managed to persist a value across test runs. But still I caught you!";
        for (const key of getAllPropertyNames(s)) {
            const valueBefore = values[key];
            const valueNow = s[key];
            if (key === "__proto__" || valueBefore === valueNow || (isNaN(valueBefore) && isNaN(valueNow))) {
                continue;
            }
            try {
                s[key] = valueBefore;
            }
            catch (e) {
            }
            if (s[key] !== valueBefore) {
                console.warn(terminationMsg, "Variable name: " + key);
                needTermination = true;
            }
        }
        return needTermination;
    }
})(function execute(code, readline, writeline) {
    eval(code);
});
