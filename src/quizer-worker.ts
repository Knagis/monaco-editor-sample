interface WorkerRequest {
    code: string;
    tests: Array<{
        input: string[];
        output: string[];
    }>;
    timestamp: number;
}

interface WorkerResponse {
    needTermination?: boolean;
    pass: boolean;
    error?: string;
}

(function (execute: Function) {

    onmessage = messageHandler;
    freezeSelf();

    return; // only function definitions follow

    function messageHandler(event: MessageEvent) {
        const request = event.data as WorkerRequest;

        for (let testIndex = 0; testIndex < request.tests.length; testIndex++) {
            const test = request.tests[testIndex];

            let lineCounter = 0;
            const readline = () => {
                return test.input[lineCounter++];
            };

            let output: string[] = [];
            const writeline = (...args: any[]) => {
                output.push(args ? args.join("") : "");
            };

            let error: string | null = null;
            let needTermination: boolean;
            const selfValues = captureSelf();

            try {
                execute(
                    request.code,
                    readline,
                    writeline);

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
            } catch (e) {
                error = e.message;
                if (e.stack) {
                    const m = (e.stack as string).match(/<anonymous>:(\d+):(\d+)/);
                    if (m) {
                        error = `[${m[1]}:${m[2]}]: ${e.message}`;
                    }
                }
            } finally {
                needTermination = restoreSelf(selfValues);
            }

            if (needTermination) {
                (<any>postMessage)({ needTermination: true, pass: false, error: `Test #${testIndex}: found persistent global variable` });
                return;
            }

            if (error) {
                (<any>postMessage)({ pass: false, error: `Test #${testIndex}: ${error}` });
                return;
            }
        }

        (<any>postMessage)({ pass: true });
    };

    function freezeSelf() {
        const s = self as any;

        const allowedKeys: Array<string> = [
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
                    } catch (e) {
                    }

                    if (s[key]) {
                        console.warn("Could not delete", key, s[key]);
                    }
                }
            }
        }

        const alreadyFrozed: any[] = [self];
        for (const key of getAllPropertyNames(s)) {
            freezeObjectDeep(s[key], alreadyFrozed);
        }
    }

    function freezeObjectDeep(obj: any, alreadyVisited: any[] = []) {
        if (obj instanceof Object && alreadyVisited.indexOf(obj) === -1) {
            alreadyVisited.push(obj);
            Object.freeze(obj);

            for (const k of getAllPropertyNames(obj)) {
                try {
                    freezeObjectDeep(obj[k], alreadyVisited);
                } catch (e) {
                }
            }
        }
    }

    function getAllPropertyNames(obj: any): any[] {
        if (obj == null) {
            return [];
        }

        const keys: any[] = Object.getOwnPropertyNames(obj);
        const symbols: any[] = Object.getOwnPropertySymbols(obj);

        const proto = Object.getPrototypeOf(obj);

        return keys.concat(symbols).concat(getAllPropertyNames(proto));
    }

    function captureSelf() {
        const s = {} as any;
        for (const key of getAllPropertyNames(self)) {
            s[key] = (self as any)[key];
        }

        delete self.onmessage;
        delete self.postMessage;

        return s;
    }

    function restoreSelf(values: any) {
        const s = self as any;

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
            } catch (e) {
            }

            if (s[key] !== valueBefore) {
                console.warn(terminationMsg, "Variable name: " + key);
                needTermination = true;
            }
        }

        return needTermination;
    }


})(
    function execute(code: string, readline: Function, writeline: Function): void {
        eval(code);
    }
);