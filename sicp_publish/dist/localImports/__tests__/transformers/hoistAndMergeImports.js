"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../../../mocks/context");
const parser_1 = require("../../../parser/parser");
const types_1 = require("../../../types");
const hoistAndMergeImports_1 = require("../../transformers/hoistAndMergeImports");
const utils_1 = require("../utils");
describe('hoistAndMergeImports', () => {
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
        (0, hoistAndMergeImports_1.hoistAndMergeImports)(actualProgram);
        expect((0, utils_1.stripLocationInfo)(actualProgram)).toEqual((0, utils_1.stripLocationInfo)(expectedProgram));
    };
    test('hoists import declarations to the top of the program', () => {
        const actualCode = `
      function square(x) {
        return x * x;
      }

      import { a, b, c } from "./a.js";

      export { square };

      import x from "source-module";

      square(3);
    `;
        const expectedCode = `
      import { a, b, c } from "./a.js";
      import x from "source-module";

      function square(x) {
        return x * x;
      }

      export { square };

      square(3);
    `;
        assertASTsAreEquivalent(actualCode, expectedCode);
    });
    test('merges import declarations from the same module', () => {
        const actualCode = `
      import { a, b, c } from "./a.js";
      import { d } from "./a.js";
      import { x } from "./b.js";
      import { e, f } from "./a.js";
    `;
        const expectedCode = `
      import { a, b, c, d, e, f } from "./a.js";
      import { x } from "./b.js";
    `;
        assertASTsAreEquivalent(actualCode, expectedCode);
    });
});
//# sourceMappingURL=hoistAndMergeImports.js.map