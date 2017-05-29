"use strict";
(() => {
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
    const statusClock = document.getElementById("status-clock");
    const maxTestRunTime = 5000;
    let worker = startWorker();
    let lastRequest = null;
    let lastRequestStarted = null;
    let isRunTestScheduled = false;
    let isTestRunning = false;
    let waitIconTimer = 0;
    let isFinished = false;
    let taskDescription = JSON.parse(localStorage.getItem("quizer-task") || "null");
    const beep = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
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
    document.getElementById("btn-finish").addEventListener("click", e => {
        e.preventDefault();
        localStorage.removeItem("quizer-task");
        localStorage.removeItem("quizer-code");
        localStorage.removeItem("quizer-time");
        document.location.href = "index.html";
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
    window.setInterval(updateClock, 500);
    function finishSession(timeout) {
        if (isFinished)
            return;
        if (timeout && (isTestRunning || !lastRequest)) {
            // wait for the test to finish - perhaps it was successful and this is not a timeout after all
            window.setTimeout(() => finishSession(true), 500);
            return;
        }
        isFinished = true;
        if (editor) {
            if (!timeout && lastRequest) {
                // for cosmetics, set the correct code in the editor
                editor.setValue(lastRequest.code);
            }
            editor.updateOptions({
                readOnly: true
            });
        }
        statusClock.innerHTML = "--:--";
        document.getElementById("finish-overlay").style.display = "";
        document.getElementById("finish-title").innerHTML = timeout ? "Time ran out" : "You did it!";
        document.getElementById("finish-description").innerHTML = timeout
            ? "Unfortunately you did not complete the task in the given time. Better luck next time!"
            : "Congratulations on completing the task! You did it in " + formatTime(taskDescription.duration * 1000 - taskDescription.endTimestamp + Date.parse(localStorage.getItem("quizer-time") || "")) + ".";
    }
    function formatTime(ms) {
        let min = ((ms / 60000) | 0).toFixed(0);
        if (min.length === 1)
            min = "0" + min;
        let sec = ((ms / 1000 % 60) | 0).toFixed(0);
        if (sec.length === 1)
            sec = "0" + sec;
        return min + ":" + sec;
    }
    function updateClock() {
        if (!taskDescription || !taskDescription.endTimestamp || isFinished)
            return;
        const left = taskDescription.endTimestamp - Date.now();
        if (left < 0) {
            finishSession(true);
            return;
        }
        let str = formatTime(left);
        if (str !== statusClock.innerHTML) {
            statusClock.innerHTML = str;
            if (left <= 15000 || (left >= 28000 && left <= 30000))
                beep.play();
        }
        if (left <= 30000)
            statusClock.className = "danger";
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
        changeStatusIcon(response.pass ? "ok" : "error");
        isTestRunning = false;
        if (response.pass && lastRequest && lastRequest.code.length <= taskDescription.target) {
            if (!localStorage.getItem("quizer-time"))
                localStorage.setItem("quizer-time", (lastRequestStarted || new Date()).toISOString());
            finishSession(false);
            return;
        }
        if (!response.pass) {
            console.error((response.error || "").replace(/<a.+?>(.+?)<\/a>/g, "$1"));
            statusErrorText.innerHTML = response.error || "";
            for (const a of Array.from(statusErrorText.getElementsByClassName("error-pos"))) {
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
        if (isTestRunning && lastRequestStarted && new Date().valueOf() - lastRequestStarted.valueOf() > maxTestRunTime) {
            worker.onmessage = () => { };
            worker.terminate();
            isTestRunning = false;
            if (!isFinished) {
                worker = startWorker();
                processResponse({ pass: false, error: "The test execution timed out." });
            }
        }
    }
    function runTest() {
        checkTermination();
        if (!editor || isTestRunning) {
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
        lastRequest = request;
        lastRequestStarted = new Date();
        isTestRunning = true;
        worker.postMessage(request);
        window.setTimeout(checkTermination, maxTestRunTime + 500);
        waitIconTimer = window.setTimeout(() => { changeStatusIcon("wait"); }, 200);
    }
    function isFontLoaded() {
        const e1 = document.createElement("span");
        e1.style.fontFamily = "Inconsolata, sans-serif";
        const e2 = document.createElement("span");
        e2.style.fontFamily = "sans-serif";
        e1.innerHTML = e2.innerHTML = "|";
        const body = document.body;
        body.appendChild(e1);
        body.appendChild(e2);
        const result = e1.offsetWidth !== e2.offsetWidth;
        body.removeChild(e1);
        body.removeChild(e2);
        return result;
    }
    function startEditor() {
        let fontFamily = "Consolas, Monaco, 'Courier New', monospace";
        if (!isFontLoaded()) {
            if (performance.now && performance.now() < 3000) {
                // delay for up to 3 secs after page load
                window.setTimeout(startEditor, 500);
                return;
            }
        }
        else {
            fontFamily = "Inconsolata, " + fontFamily;
        }
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
                fontFamily: fontFamily,
            });
            editor.focus();
            editor.onDidChangeModelContent(runTest);
            runTest();
            if (!taskDescription.endTimestamp) {
                taskDescription.endTimestamp = (1000 + Date.now() + taskDescription.duration * 1000) || 0;
                localStorage.setItem("quizer-task", JSON.stringify(taskDescription));
            }
        });
    }
    function md2html(md) {
        const reader = new commonmark.Parser();
        const writer = new commonmark.HtmlRenderer();
        const parsed = reader.parse(md);
        return writer.render(parsed);
    }
})();
