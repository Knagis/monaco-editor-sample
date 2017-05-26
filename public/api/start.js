define({
    code: `const lineCount = parseInt(readline());
const lines = new Array(lineCount);
for (let i = 0; i < lineCount; i++) {
    lines[i] = readline();
}

let total = 0;
for (const line of lines) {
    let lineTotal = 0;
    const numbers = line.split(" ");
    for (const num of numbers) {
        lineTotal += parseInt(num);
        total += parseInt(num);
    }

    writeline(lineTotal);
}

writeline(total);
`,
    tests: [
        { input: ["2", "2 1", "5 3"], output: ["3", "8", "11"] },
        { input: ["0"], output: ["0"] },
    ]
});