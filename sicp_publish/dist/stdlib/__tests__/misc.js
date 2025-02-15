"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const formatters_1 = require("../../utils/formatters");
const testing_1 = require("../../utils/testing");
test('parse_int with valid args is ok, radix 2', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    parse_int('1100101010101', 2);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(parseInt('1100101010101', 2));
});
test('parse_int with valid args is ok, radix 36', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    parse_int('uu1', 36);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(parseInt('uu1', 36));
});
test('parse_int with valid args is ok, but invalid str for radix', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    parse_int('uu1', 2);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(parseInt('uu1', 2));
});
test('parse_int with non-string arg str throws error', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    parse_int(42, 2);
  `).toMatchInlineSnapshot(`"Line 1: Error: parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive."`);
});
test('parse_int with non-integer arg radix throws error', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    parse_int(42, 2.1);
  `).toMatchInlineSnapshot(`"Line 1: Error: parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive."`);
});
test('parse_int with radix outside [2, 36] throws error, radix=1', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    parse_int('10', 1);
  `).toMatchInlineSnapshot(`"Line 1: Error: parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive."`);
});
test('parse_int with radix outside [2, 36] throws error, radix=37', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    parse_int('10', 37);
  `).toMatchInlineSnapshot(`"Line 1: Error: parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive."`);
});
test('parse_int with string arg radix throws error', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    parse_int(42, '2');
  `).toMatchInlineSnapshot(`"Line 1: Error: parse_int expects two arguments a string s, and a positive integer i between 2 and 36, inclusive."`);
});
test('char_at with non string first argument errors', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    char_at(42, 123);
  `).toMatchInlineSnapshot(`"Line 1: Error: char_at expects the first argument to be a string."`);
});
test('char_at with non nonnegative integer second argument errors', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    char_at('', -1);
  `).toMatchInlineSnapshot(`"Line 1: Error: char_at expects the second argument to be a nonnegative integer."`);
});
test('char_at with non nonnegative integer second argument errors', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    char_at('', "");
  `).toMatchInlineSnapshot(`"Line 1: Error: char_at expects the second argument to be a nonnegative integer."`);
});
test('char_at with valid args is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    char_at("123", 0);
  `).toBe('1');
});
test('char_at with valid args (but index out of bounds) returns undefined', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    char_at("123", 3);
  `).toBe(undefined);
});
test('arity with nullary function is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    arity(math_random);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(0);
});
test('arity with function with parameters is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    arity(arity);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(1);
});
test('arity ignores the rest parameter', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    arity(display);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(1);
});
test('arity with user-made function is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    function test(x, y) {
      return x + y;
    }
    arity(test);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(2);
});
test('arity with user-made lambda function is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    arity(x => x);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(1);
});
test('arity with user-made nullary function is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    arity(() => undefined);
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toBe(0);
});
test('arity with user-made function with rest parameter is ok', () => {
    return (0, testing_1.expectResult)((0, formatters_1.stripIndent) `
    function test(...xs) {
      return xs;
    }
    arity(test);
  `, { chapter: types_1.Chapter.SOURCE_3, native: true }).toBe(0);
});
test('arity with non-function arg f throws error', () => {
    return (0, testing_1.expectParsedError)((0, formatters_1.stripIndent) `
    arity('function');
  `, { chapter: types_1.Chapter.SOURCE_1, native: true }).toMatchInlineSnapshot(`"Line 1: Error: arity expects a function as argument"`);
});
//# sourceMappingURL=misc.js.map