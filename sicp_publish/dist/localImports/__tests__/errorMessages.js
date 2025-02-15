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
const index_1 = require("../../index");
const context_1 = require("../../mocks/context");
const types_1 = require("../../types");
describe('syntax errors', () => {
    let context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    beforeEach(() => {
        context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    });
    describe('FatalSyntaxError', () => {
        test('file path is not part of error message if the program is single-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          const x = 1;
          const x = 1;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 3: SyntaxError: Identifier 'x' has already been declared (3:16)"`);
        }));
        test('file path is part of error message if the program is multi-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          const x = 1;
          const x = 1;
        `,
                '/b.js': `
          const y = 2;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"[/a.js] Line 3: SyntaxError: Identifier 'x' has already been declared (3:16)"`);
        }));
    });
    describe('MissingSemicolonError', () => {
        test('file path is not part of error message if the program is single-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          const x = 1
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 2: Missing semicolon at the end of statement"`);
        }));
        test('file path is part of error message if the program is multi-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          const x = 1
        `,
                '/b.js': `
          const y = 2;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"[/a.js] Line 2: Missing semicolon at the end of statement"`);
        }));
    });
    describe('TrailingCommaError', () => {
        test('file path is not part of error message if the program is single-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          const x = [1, 2, 3,];
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 2: Trailing comma"`);
        }));
        test('file path is part of error message if the program is multi-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          const x = [1, 2, 3,];
        `,
                '/b.js': `
          const y = 2;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"[/a.js] Line 2: Trailing comma"`);
        }));
    });
});
describe('non-syntax errors (non-transpiled)', () => {
    let context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    beforeEach(() => {
        context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
        context.executionMethod = 'interpreter';
    });
    describe('SourceError', () => {
        test('file path is not part of error message if the program is single-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          1 + 'hello';
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 2: Expected number on right hand side of operation, got string."`);
        }));
        test('file path is part of error message if the program is multi-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          1 + 'hello';
        `,
                '/b.js': `
          const y = 2;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"[/a.js] Line 2: Expected number on right hand side of operation, got string."`);
        }));
    });
});
describe('non-syntax errors (transpiled)', () => {
    let context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    beforeEach(() => {
        context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
        context.executionMethod = 'native';
    });
    describe('SourceError', () => {
        test('file path is not part of error message if the program is single-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          1 + 'hello';
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 2: Expected number on right hand side of operation, got string."`);
        }));
        test('file path is part of error message if the program is multi-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          1 + 'hello';
        `,
                '/b.js': `
          const y = 2;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"[/a.js] Line 2: Expected number on right hand side of operation, got string."`);
        }));
    });
});
// We specifically test typed Source because it makes use of the Babel parser.
describe('non-syntax errors (non-transpiled & typed)', () => {
    let context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4, types_1.Variant.TYPED);
    beforeEach(() => {
        context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4, types_1.Variant.TYPED);
        context.executionMethod = 'interpreter';
    });
    describe('SourceError', () => {
        test('file path is not part of error message if the program is single-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          2 + 'hello';
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 2: Type 'string' is not assignable to type 'number'."`);
        }));
        test('file path is part of error message if the program is multi-file', () => __awaiter(void 0, void 0, void 0, function* () {
            const files = {
                '/a.js': `
          2 + 'hello';
        `,
                '/b.js': `
          const y = 2;
        `
            };
            yield (0, index_1.runFilesInContext)(files, '/a.js', context);
            expect((0, index_1.parseError)(context.errors)).toMatchInlineSnapshot(`"[/a.js] Line 2: Type 'string' is not assignable to type 'number'."`);
        }));
    });
});
//# sourceMappingURL=errorMessages.js.map