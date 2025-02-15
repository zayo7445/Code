"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const formatters_1 = require("../../utils/formatters");
const testing_1 = require("../../utils/testing");
test('Parses empty program', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse(""), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses literals', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("3; true; false; ''; \\"\\"; 'bob'; 1; 20;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses name expression', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("x;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses name expressions', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("x; moreNames; undefined;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses infix expressions', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("3 + 5 === 8 || !true && false;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses declaration statements', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("const x = 5; let y = x;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses assignment statements', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("x = 5; x = x; if (true) { x = 5; } else {}"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses if statements', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("if (true) { hi; } else { haha; } if (false) {} else {}"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses multi-argument arrow function expressions properly', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("(x, y) => x + 1;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses multi-argument arrow function expressions properly', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("(x, y) => x + 1;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses multi-argument arrow function assignments properly', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("const y = (x, y) => x + 1;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses arrow function expressions properly', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("x => x + 1;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses arrow function assignments properly', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("const y = x => x + 1;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses function calls', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("f(x); thrice(thrice)(plus_one)(0);"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses fibonacci', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("function fib(x) { return x <= 1 ? x : fib(x-1) + fib(x-2); } fib(4);"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses object notation', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("let x = {a: 5, b: 10, 'key': value};"), undefined, 2);
    `, { chapter: types_1.Chapter.LIBRARY_PARSER });
});
test('Parses property access', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("a[b]; a.b; a[5]; a['b'];"), undefined, 2);
    `, { chapter: types_1.Chapter.LIBRARY_PARSER });
});
test('Parses property assignment', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("a[b] = 5; a.b = value; a[5] = 'value'; a['b'] = 42;"), undefined, 2);
    `, { chapter: types_1.Chapter.LIBRARY_PARSER });
});
test('Parses loops', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.oneLine) `
    stringify(parse(
      "while (true) {
        continue;
        break;
      }
      for (let i = 0; i < 1; i = i + 1) {
        continue;
        break;
      }
      for (i = 0; i < 1; i = i + 1) {
        continue;
        break;
      }"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4, native: true });
});
test('Parses assignment expressions', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.stripIndent) `
    stringify(parse("x = y = x;"), undefined, 2);
    `, { chapter: types_1.Chapter.SOURCE_4 });
});
test('Parses default import specifiers', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.oneLine) `
    stringify(parse(
      "import defaultExport from 'module-name';"), undefined, 2);
    `, { chapter: types_1.Chapter.LIBRARY_PARSER });
});
test('Parses named export declarations', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.oneLine) `
    stringify(parse(
      "export const x = 42;
      export const square = x => x * x;
      export function id(x) {
        return x;
      }
      export { x as y };"), undefined, 2);
    `, { chapter: types_1.Chapter.LIBRARY_PARSER });
});
test('Parses default export declarations', () => {
    return (0, testing_1.snapshotSuccess)((0, formatters_1.oneLine) `
    stringify(parse(
      "export const x = 42;
      export default x;"), undefined, 2);
    stringify(parse(
      "export default function square(x) {
        return x * x;
      }"), undefined, 2);
    `, { chapter: types_1.Chapter.LIBRARY_PARSER });
});
//# sourceMappingURL=parser.js.map