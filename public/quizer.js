"use strict";
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
let editor = null;
const statusBar = document.getElementById("status-bar");
const statusCharCount = document.getElementById("status-chars");
const statusCharTarget = document.getElementById("status-chars-target");
const statusErrorText = document.getElementById("status-error-text");
const maxTestRunTime = 5000;
let worker = startWorker();
let lastRequest = null;
let lastRequestStarted = null;
let isRunTestScheduled = false;
let waitIconTimer = 0;
let taskDescription = JSON.parse(localStorage.getItem("quizer-task") || "null");
window.addEventListener("resize", () => {
    if (editor)
        editor.layout();
});
document.getElementById("btn-restore").addEventListener("click", e => {
    e.preventDefault();
    if (editor && taskDescription) {
        if (editor.getValue() === taskDescription.code) {
            alert("This is already the initial version of the code.");
        }
        else if (confirm("Are you sure you want to reset your code to the initial version?")) {
            editor.setValue(taskDescription.code);
        }
    }
});
if (!taskDescription) {
    require(["api/start.js"], (td) => {
        taskDescription = td;
        localStorage.setItem("quizer-task", JSON.stringify(td));
        startEditor();
    });
}
else {
    taskDescription.code = localStorage.getItem("quizer-code") || "";
    startEditor();
}
function startWorker() {
    const worker = new Worker("quizer-worker.js");
    worker.onmessage = (event) => {
        const response = event.data;
        processResponse(response);
    };
    return worker;
}
function changeStatusIcon(icon) {
    if (isRunTestScheduled && icon !== "wait")
        return;
    if (waitIconTimer)
        window.clearTimeout(waitIconTimer);
    statusBar.className = "status-" + icon;
}
function processResponse(response) {
    lastRequestStarted = null;
    changeStatusIcon(response.pass ? "ok" : "error");
    if (!response.pass) {
        console.error(response.error);
        statusErrorText.innerHTML = response.error || "";
        for (const a of statusErrorText.getElementsByClassName("error-pos")) {
            a.addEventListener("click", (event) => {
                event.preventDefault();
                if (editor) {
                    const anchor = event.currentTarget;
                    const lineNumber = parseInt(anchor.getAttribute("data-line") || "1");
                    const column = parseInt(anchor.getAttribute("data-col") || "1");
                    editor.setPosition({ lineNumber, column });
                    editor.setSelection({ startLineNumber: lineNumber, startColumn: column, endLineNumber: lineNumber, endColumn: column + 1 });
                    editor.focus();
                }
            });
        }
    }
}
function checkTermination() {
    if (lastRequestStarted && new Date().valueOf() - lastRequestStarted.valueOf() > maxTestRunTime) {
        worker.onmessage = () => { };
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
    localStorage.setItem("quizer-code", code);
    const request = {
        code: code,
        tests: taskDescription.tests,
    };
    lastRequestStarted = new Date();
    worker.postMessage(request);
    window.setTimeout(checkTermination, maxTestRunTime + 500);
    waitIconTimer = window.setTimeout(() => { changeStatusIcon("wait"); }, 200);
}
function startEditor() {
    require([...libs, 'vs/editor/editor.main'], (...libSource) => {
        const container = document.getElementById('container');
        if (!container)
            throw new Error("container missing");
        const description = document.getElementById("description-text");
        if (description)
            description.innerHTML = md2html(taskDescription.description || "");
        statusCharTarget.innerHTML = (taskDescription.target || 0).toFixed(0);
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
function md2html(md) {
    const reader = new commonmark.Parser();
    const writer = new commonmark.HtmlRenderer();
    const parsed = reader.parse(md);
    return writer.render(parsed);
}
