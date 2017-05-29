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

onmessage = (event) => {
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
                        error = `Output line ${i+1} is not correct.\nExpected '${test.output[i]}'\nGot '${output[i]}'`;
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

function captureSelf() {
    return Object.assign({}, self);
}

function restoreSelf(values: any) {
    for (const key of Object.keys(self) as Array<keyof typeof self>) {
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
            (self as any)[key] = valueBefore;
        } catch (e) {
            console.warn(`Cannot restore the value of global '${key}'.`);
        }
    }
}

function execute(code: string, console: any, readline: Function, writeline: Function): void {
    const onmessage = null;
    const close = null;
    const postMessage = null;
    const caches = null;
    const location = null;
    const performance = null;
    const onerror = null;
    const self = null;
    const createImageBitmap = null;
    const dispatchEvent = null;
    const removeEventListener = null;
    const indexedDB = null;
    const msIndexedDB = null;
    const navigator = null;
    const clearImmediate = null;
    const clearInterval = null;
    const clearTimeout = null;
    const importScripts = null;
    const setImmediate = null;
    const setInterval = null;
    const setTimeout = null;
    const fetch = null;
    const addEventListener = null;
    Object.freeze(eval);
    eval(code);
}