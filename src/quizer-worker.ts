interface WorkerRequest {
    code: string;
    tests: Array<{
        input: string[];
        output: string[];
    }>;
}

interface WorkerResponse {
    pass: boolean;
    error?: string;
}

(function () {

    onmessage = messageHandler;
    freezeSelf();

    return; // only function definitions follow

    function messageHandler(event: MessageEvent) {
        const request = event.data as WorkerRequest;
        const consoleWrapper = {
            log: (...args: any[]) => console.log.apply(console, args),
        };

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
            const selfValues = captureSelf();

            try {
                execute(
                    request.code,
                    consoleWrapper,
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
                        error = `<a class="error-pos" data-line="${m[1]}" data-col="${m[2]}">Line ${m[1]}, column ${m[2]}</a>: ${e.message}`;
                    }
                }
            } finally {
                restoreSelf(selfValues);
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
        return s;
    }

    function restoreSelf(values: any) {
        for (const key of getAllPropertyNames(self)) {
            const valueBefore = values[key];
            const valueNow = (self as any)[key];
            if (valueBefore === valueNow) {
                continue;
            }

            if (valueBefore === void 0) {
                delete (self as any)[key];
                continue;
            }

            try {
                (self as any)[key] = valueBefore;
            } catch (e) {
                console.warn(`Cannot restore the value of global '${key}'.`);
            }
        }
    }

    function execute(code: string, console: any, readline: Function, writeline: Function): void {
        const onmessage = null;
        const postMessage = null;
        const self = null;
        eval(code);
    }
})();