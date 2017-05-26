onmessage = (event) => {
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
        if (error) {
            postMessage({ pass: false, error: `Test #${testIndex}: ${error}` });
            return;
        }
    }
    postMessage({ pass: true });
};
function execute(code, console, readline, writeline) {
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
