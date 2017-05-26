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
    ],
    target: 100,
    duration: 50,
    description: `
Shorten the given code as much as possible within the given time. Everything can
go as long as the tests are still green.

The first line of the input is the number of lines that will follow (0 or larger).
After that each line has one or more integer numbers in it, separated by spaces.

The output must contain the sum of numbers in each line, separated by newlines.
The last line should contain the sum of all lines.

**Sample input**

~~~
2
2 1
5 3
~~~

**Sample output**

~~~
3
8
11
~~~
`,
});