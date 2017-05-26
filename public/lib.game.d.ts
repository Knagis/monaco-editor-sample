
/**
 * Reads a single line from the input. The result does not include the newline char.
 */
declare function readline(): string;
/**
 * Writes one or more arguments to the output. Adds a trailing newline. 
 * If multiple arguments are specified, no separator characters are added.
 */
declare function writeline(...args: Array<number|string>): void;

interface Console {
    log(...args: any[]): void;
}

/**
 * Gives access to write log to the browser console.
 */
declare var console: Console;