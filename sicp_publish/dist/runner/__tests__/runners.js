"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const errors_1 = require("../../errors/errors");
const context_1 = require("../../mocks/context");
const parser_1 = require("../../parser/parser");
const types_1 = require("../../types");
const astCreator_1 = require("../../utils/astCreator");
const htmlRunner_1 = require("../htmlRunner");
const JAVASCRIPT_CODE_SNIPPETS_NO_ERRORS = [
    {
        name: 'LITERAL OBJECT',
        snippet: `
          const sourceLanguage = {
              chapter: 1,
              variant: "default",
              displayName: "Source 1"
          }
          sourceLanguage["displayName"];
          `,
        value: 'Source 1',
        errors: []
    },
    {
        name: 'OOP',
        snippet: `
          class Rectangle {
              constructor(height, width) {
                this.height = height;
                this.width = width;
              }
          }
          const rect1 = new Rectangle(1080, 1920);
          rect1.height;
          `,
        value: 1080,
        errors: []
    },
    {
        name: 'ARRAY MAP',
        snippet: `
          [1,2,3,4].map(num => num + 1);
          `,
        value: [2, 3, 4, 5],
        errors: []
    },
    {
        name: 'ARRAY FILTER',
        snippet: `
          [1,2,3,4].filter(num => num > 2);
          `,
        value: [3, 4],
        errors: []
    },
    {
        name: 'TRY CATCH',
        snippet: `
            let a = 0;
            try {
              nonExistentFunction();
            } catch (error) {
              // catch error
            } finally {
              a++;
            }
            a;
           `,
        value: 1,
        errors: []
    }
];
const JAVASCRIPT_CODE_SNIPPETS_ERRORS = [
    {
        name: 'UNDEFINED VARIABLE',
        snippet: `
          const a = b;
          `,
        value: undefined,
        errors: [new errors_1.UndefinedVariable('b', (0, astCreator_1.locationDummyNode)(2, 20, 'source'))]
    },
    {
        name: 'SYNTAX ERROR',
        snippet: `function(){}`,
        value: undefined,
        errors: [
            new parser_1.FatalSyntaxError({ start: { line: 1, column: 8 }, end: { line: 1, column: 9 }, source: undefined }, 'SyntaxError: Unexpected token (1:8)')
        ]
    },
    {
        name: 'REFERENCE ERROR',
        snippet: `
            function h() {
              g();
            }
            h();
            `,
        value: undefined,
        errors: [new errors_1.UndefinedVariable('g', (0, astCreator_1.locationDummyNode)(3, 14, 'source'))]
    }
];
// FullJS Unit Tests
test('Source builtins are accessible in fullJS program', () => __awaiter(void 0, void 0, void 0, function* () {
    const fullJSProgram = `
    parse('head(list(1,2,3));');
    `;
    const fullJSContext = (0, context_1.mockContext)(types_1.Chapter.FULL_JS, types_1.Variant.DEFAULT);
    yield (0, __1.runInContext)(fullJSProgram, fullJSContext);
    expect(fullJSContext.errors.length).toBeLessThanOrEqual(0);
}));
test('Simulate fullJS REPL', () => __awaiter(void 0, void 0, void 0, function* () {
    const fullJSContext = (0, context_1.mockContext)(types_1.Chapter.FULL_JS, types_1.Variant.DEFAULT);
    const replStatements = [
        ['const x = 1;', undefined],
        ['x;', 1],
        ['const y = x + 1;', undefined],
        ['y;', 2]
    ];
    for (const replStatement of replStatements) {
        const [statement, expectedResult] = replStatement;
        const result = yield (0, __1.runInContext)(statement, fullJSContext);
        expect(result.status).toStrictEqual('finished');
        expect(result.value).toStrictEqual(expectedResult);
        expect(fullJSContext.errors).toStrictEqual([]);
    }
}));
describe('Native javascript programs are valid in fullJSRunner', () => {
    it.each([...JAVASCRIPT_CODE_SNIPPETS_NO_ERRORS])(`%p`, ({ snippet, value, errors }) => __awaiter(void 0, void 0, void 0, function* () {
        const fullJSContext = (0, context_1.mockContext)(types_1.Chapter.FULL_JS, types_1.Variant.DEFAULT);
        const result = yield (0, __1.runInContext)(snippet, fullJSContext);
        expect(result.status).toStrictEqual('finished');
        expect(result.value).toStrictEqual(value);
        expect(fullJSContext.errors).toStrictEqual(errors);
    }));
});
describe('Error locations are handled well in fullJS', () => {
    it.each([...JAVASCRIPT_CODE_SNIPPETS_ERRORS])(`%p`, ({ snippet, value, errors }) => __awaiter(void 0, void 0, void 0, function* () {
        const fullJSContext = (0, context_1.mockContext)(types_1.Chapter.FULL_JS, types_1.Variant.DEFAULT);
        const result = yield (0, __1.runInContext)(snippet, fullJSContext);
        expect(result.status).toStrictEqual('error');
        expect(result.value).toStrictEqual(value);
        expect(fullJSContext.errors).toStrictEqual(errors);
    }));
});
// Source Native Unit Tests
describe('Additional JavaScript features are not available in Source Native', () => {
    it.each([...JAVASCRIPT_CODE_SNIPPETS_NO_ERRORS])(`%p`, ({ snippet }) => __awaiter(void 0, void 0, void 0, function* () {
        // Test all chapters from Source 1 - 4
        for (let chapterNum = 0; chapterNum <= 4; chapterNum++) {
            const sourceNativeContext = (0, context_1.mockContext)(chapterNum, types_1.Variant.NATIVE);
            const result = yield (0, __1.runInContext)(snippet, sourceNativeContext);
            expect(result.status).toStrictEqual('error');
            expect(sourceNativeContext.errors.length).toBeGreaterThan(0);
        }
    }));
});
// HTML Unit Tests
test('Error handling script is injected in HTML code', () => __awaiter(void 0, void 0, void 0, function* () {
    const htmlDocument = '<p>Hello World!</p>';
    const htmlContext = (0, context_1.mockContext)(types_1.Chapter.HTML, types_1.Variant.DEFAULT);
    const result = yield (0, __1.runInContext)(htmlDocument, htmlContext);
    expect(result.status).toStrictEqual('finished');
    expect(result.value).toStrictEqual(htmlRunner_1.htmlErrorHandlingScript + htmlDocument);
}));
//# sourceMappingURL=runners.js.map