"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../../../mocks/context");
const parser_1 = require("../../../parser/parser");
const types_1 = require("../../../types");
const removeNonSourceModuleImports_1 = require("../../transformers/removeNonSourceModuleImports");
const utils_1 = require("../utils");
describe('removeNonSourceModuleImports', () => {
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
        (0, removeNonSourceModuleImports_1.removeNonSourceModuleImports)(actualProgram);
        expect((0, utils_1.stripLocationInfo)(actualProgram)).toEqual((0, utils_1.stripLocationInfo)(expectedProgram));
    };
    test('removes ImportDefaultSpecifier nodes', () => {
        const actualCode = `
      import a from "./a.js";
      import x from "source-module";
    `;
        const expectedCode = '';
        assertASTsAreEquivalent(actualCode, expectedCode);
    });
    // While 'removeNonSourceModuleImports' will remove ImportNamespaceSpecifier nodes, we
    // cannot actually test it because ImportNamespaceSpecifier nodes are banned in the parser.
    // test('removes ImportNamespaceSpecifier nodes', () => {
    //   const actualCode = `
    //     import * as a from "./a.js";
    //     import * as x from "source-module";
    //   `
    //   const expectedCode = ''
    //   assertASTsAreEquivalent(actualCode, expectedCode)
    // })
    test('removes only non-Source module ImportSpecifier nodes', () => {
        const actualCode = `
      import { a, b, c } from "./a.js";
      import { x, y, z } from "source-module";
    `;
        const expectedCode = `
      import { x, y, z } from "source-module";
    `;
        assertASTsAreEquivalent(actualCode, expectedCode);
    });
});
//# sourceMappingURL=removeNonSourceModuleImports.js.map