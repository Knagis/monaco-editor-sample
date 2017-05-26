"use strict"

declare var require: any;

interface TaskDescription extends WorkerRequest {
}

require.config({
    paths: {
        'text': 'node_modules/text/text',
        'vs': 'node_modules/monaco-editor/min/vs',
        'lib/': 'node_modules/typescript/lib/',
    }
});

const libs = [
    "text!lib/lib.es2015.d.ts",
    "text!lib/lib.es2015.collection.d.ts",
    "text!lib/lib.es2015.generator.d.ts",
    "text!lib/lib.es2015.iterable.d.ts",
    "text!lib/lib.es2015.promise.d.ts",
    "text!lib/lib.es2015.proxy.d.ts",
    "text!lib/lib.es2015.reflect.d.ts",
    "text!lib/lib.es2015.symbol.d.ts",
    "text!lib/lib.es2015.symbol.wellknown.d.ts",
    "text!lib/lib.es5.d.ts",
    "text!./lib.game.d.ts",
];

let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const statusBar: HTMLElement = document.getElementById("status-bar") as HTMLElement;
const statusCharCount: HTMLElement = document.getElementById("status-chars") as HTMLElement;
const statusCharTarget: HTMLElement = document.getElementById("status-chars-target") as HTMLElement;

const maxTestRunTime = 5000;
let worker = startWorker();
let lastRequest: WorkerRequest | null = null;
let lastRequestStarted: Date | null = null;
let isRunTestScheduled = false;
let waitIconTimer = 0;
let taskDescription: TaskDescription = JSON.parse(localStorage.getItem("task") || "null");

window.addEventListener("resize", () => {
    if (editor) editor.layout();
});

if (!taskDescription) {
    require(["api/start.js"], (td: TaskDescription) => {
        taskDescription = td;
        localStorage.setItem("task", JSON.stringify(td));
        startEditor();
    });
} else {
    taskDescription.code = localStorage.getItem("code") || "";
    startEditor();
}

function startWorker(): Worker {
    const worker = new Worker("quizer-worker.js");
    worker.onmessage = (event) => {
        const response = event.data as WorkerResponse;
        processResponse(response);
    }
    return worker;
}

function changeStatusIcon(icon: "ok" | "error" | "wait") {
    if (isRunTestScheduled)
        return;
    if (waitIconTimer)
        window.clearTimeout(waitIconTimer);
    statusBar.className = "status-" + icon;
}

function processResponse(response: WorkerResponse) {
    lastRequestStarted = null;
    changeStatusIcon(response.pass ? "ok" : "error");
    console.log(response);
}

function checkTermination() {
    if (lastRequestStarted && new Date().valueOf() - lastRequestStarted.valueOf() > maxTestRunTime) {
        worker.onmessage = () => {};
        worker.terminate();
        worker = startWorker();
        processResponse({ pass: false, error: "The test execution timed out." });
    }
}

function runTest() {
    checkTermination();

    if (!editor || lastRequestStarted) {
        if (!isRunTestScheduled) {
            window.setTimeout(runTest, 500);
            isRunTestScheduled = true;
        }
        return;
    }
    isRunTestScheduled = false;

    const code = editor.getValue({ lineEnding: "\n", preserveBOM: false });
    if (lastRequest && lastRequest.code === code) {
        return;
    }

    statusCharCount.innerHTML = code.length.toFixed(0);
    localStorage.setItem("code", code);

    const request: WorkerRequest = {
        code: code,
        tests: taskDescription.tests,
    };

    lastRequestStarted = new Date();
    worker.postMessage(request);
    window.setTimeout(checkTermination, maxTestRunTime + 500);
    waitIconTimer = window.setTimeout(() => { changeStatusIcon("wait") }, 200);
}

function startEditor() {
    require([...libs, 'vs/editor/editor.main'], (...libSource: string[]) => {
        const container = document.getElementById('container');
        if (!container) throw new Error("container missing");

        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
        });
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            allowNonTsExtensions: true,
            noEmit: true,
            noLib: true,
        });

        for (let i = 0; i < libs.length; i++) {
            monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource[i], libs[i]);
        }

        editor = monaco.editor.create(container, {
            value: taskDescription.code,
            language: 'javascript',
            renderControlCharacters: true,
            renderWhitespace: "all",
            theme: "vs-dark",
            fontSize: 20,
        });
        editor.focus();
        editor.onDidChangeModelContent(runTest);
        runTest();
    });
}
