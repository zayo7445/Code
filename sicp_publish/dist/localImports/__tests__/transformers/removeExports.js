"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../../../mocks/context");
const parser_1 = require("../../../parser/parser");
const types_1 = require("../../../types");
const removeExports_1 = require("../../transformers/removeExports");
const utils_1 = require("../utils");
describe('removeExports', () => {
    let actualContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    let expectedContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    beforeEach(() => {
        actualContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
        expectedContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    });
    const assertASTsAreEquivalent = (actualCode, expectedCode) => {
        const actualProgram = (0, parser_1.parse)(actualCode, actualContext);
        const expectedProgram = (0, parser_1.parse)(expectedCode, expectedContext);
        if (actualProgram === undefined || expectedProgram === undefined) {
            throw utils_1.parseCodeError;
        }
        (0, removeExports_1.removeExports)(actualProgram);
        expect((0, utils_1.stripLocationInfo)(actualProgram)).toEqual((0, utils_1.stripLocationInfo)(expectedProgram));
    };
    describe('removes ExportNamedDeclaration nodes', () => {
        test('when exporting variable declarations', () => {
            const actualCode = `
        export const x = 42;
        export let y = 53;
      `;
            const expectedCode = `
        const x = 42;
        let y = 53;
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting function declarations', () => {
            const actualCode = `
        export function square(x) {
          return x * x;
        }
      `;
            const expectedCode = `
        function square(x) {
          return x * x;
        }
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting arrow function declarations', () => {
            const actualCode = `
        export const square = x => x * x;
      `;
            const expectedCode = `
        const square = x => x * x;
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting (renamed) identifiers', () => {
            const actualCode = `
        const x = 42;
        let y = 53;
        function square(x) {
          return x * x;
        }
        const id = x => x;
        export { x, y, square as sq, id as default };
      `;
            const expectedCode = `
        const x = 42;
        let y = 53;
        function square(x) {
          return x * x;
        }
        const id = x => x;
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
    });
    describe('removes ExportDefaultDeclaration nodes', () => {
        // Default exports of variable declarations and arrow function declarations
        // is not allowed in ES6, and will be caught by the Acorn parser.
        test('when exporting function declarations', () => {
            const actualCode = `
        export default function square(x) {
          return x * x;
        }
      `;
            const expectedCode = `
        function square(x) {
          return x * x;
        }
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting constants', () => {
            const actualCode = `
        const x = 42;
        export default x;
      `;
            const expectedCode = `
        const x = 42;
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting variables', () => {
            const actualCode = `
        let y = 53;
        export default y;
      `;
            const expectedCode = `
        let y = 53;
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting functions', () => {
            const actualCode = `
        function square(x) {
          return x * x;
        }
        export default square;
      `;
            const expectedCode = `
        function square(x) {
          return x * x;
        }
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting arrow functions', () => {
            const actualCode = `
        const id = x => x;
        export default id;
      `;
            const expectedCode = `
        const id = x => x;
      `;
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
        test('when exporting expressions', () => {
            const actualCode = `
        export default 123 + 456;
      `;
            const expectedCode = '';
            assertASTsAreEquivalent(actualCode, expectedCode);
        });
    });
});
//# sourceMappingURL=removeExports.js.map