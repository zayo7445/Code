"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
const formatters_1 = require("../../utils/formatters");
const testing_1 = require("../../utils/testing");
test.each([
    [types_1.Chapter.SOURCE_1, ''],
    [
        types_1.Chapter.SOURCE_1,
        `
    function name(a, b) {
      const sum = a + b;
      if (sum > 1) {
        return sum;
      } else {
        if (a % 2 === 0) {
          return -1;
        } else if (b % 2 === 0) {
          return 1;
        } else {
          return a > b ? 0 : -2;
        }
      }
    }
    name(1, 2);
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    (() => true)();
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    ((x, y) => { return x + y; })(1, 2);
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    true;
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    false;
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    'a string "" \\'\\'';
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    31.4 + (-3.14e10) * -1 % 2 / 1.5;
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    1 === 1 && 1 < 2 && 1 <= 2 && 2 >= 1 && 2 > 1 || false;
    `
    ],
    [
        types_1.Chapter.SOURCE_1,
        `
    true ? 1 : 2;
    `
    ],
    [
        types_1.Chapter.SOURCE_2,
        `
    null;
    `
    ],
    [
        types_1.Chapter.SOURCE_2,
        `
    pair(1, null);
    `
    ],
    [
        types_1.Chapter.SOURCE_2,
        `
    list(1);
    `
    ],
    [
        types_1.Chapter.SOURCE_2,
        `
    export function f(x) {
      return x;
    }
    f(5);
    `
    ],
    [
        types_1.Chapter.SOURCE_2,
        `
    export const x = 1;
    x;
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    let i = 1;
    while (i < 5) {
      i = i + 1;
    }
    i;
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    let i = 1;
    for (i = 1; i < 5; i = i + 1) {
    }
    i;
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    let i = 1;
    for (let j = 0; j < 5; j = j + 1) {
      if (j < 1) {
        continue;
      } else {
        i = i + 1;
        if (j > 2) {
          break;
        }
      }
    }
    i;
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    [];
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    [1, 2, 3];
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    [1, 2, 3][1];
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    let x = [1, 2, 3];
    x[1];
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    let x = [1, 2, 3];
    x[1] = 4;
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    let x = 3;
    let y = 4;
    let z = 5;
    x = y = z = 6;
    x;
    `
    ],
    [
        types_1.Chapter.SOURCE_3,
        `
    function f(x, y, ...z) {
      return x + y;
    }
    f(...[1, 2]);
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    ({});
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    ({a: 1, b: 2});
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    ({a: 1, b: 2})['a'];
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    ({a: 1, b: 2}).a;
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    ({'a': 1, 'b': 2}).a;
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    ({1: 1, 2: 2})['1'];
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    const key = 'a';
    ({a: 1, b: 2})[key];
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    let x = {a: 1, b: 2};
    x.a = 3;
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    let x = {a: 1, b: 2};
    x['a'] = 3;
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    let x = {a: 1, b: 2};
    const key = 'a';
    x[key] = 3;
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    import defaultExport from "module-name";
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    export default function f(x) {
      return x;
    }
    f(5);
    `
    ],
    [
        types_1.Chapter.LIBRARY_PARSER,
        `
    const x = 1;
    export default x;
    x;
    `
    ]
])('Syntaxes are allowed in the chapter they are introduced %#', (chapter, snippet) => {
    snippet = (0, formatters_1.stripIndent)(snippet);
    const parseSnippet = `parse(${JSON.stringify(snippet)});`;
    const tests = [
        (0, testing_1.snapshotSuccess)(snippet, { chapter, native: chapter !== types_1.Chapter.LIBRARY_PARSER }, 'passes'),
        (0, testing_1.snapshotSuccess)(parseSnippet, { chapter: Math.max(4, chapter), native: true }, 'parse passes')
    ];
    if (chapter > 1) {
        tests.push((0, testing_1.snapshotFailure)(snippet, { chapter: chapter - 1 }, 'fails a chapter below'));
    }
    return Promise.all(tests);
});
//# sourceMappingURL=allowed-syntax.js.map