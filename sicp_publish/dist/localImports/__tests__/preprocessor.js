"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const context_1 = require("../../mocks/context");
const parser_1 = require("../../parser/parser");
const localImport_prelude_1 = require("../../stdlib/localImport.prelude");
const types_1 = require("../../types");
const preprocessor_1 = require("../preprocessor");
const utils_1 = require("./utils");
describe('getImportedLocalModulePaths', () => {
    let context = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    beforeEach(() => {
        context = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    });
    const assertCorrectModulePathsAreReturned = (code, baseFilePath, expectedModulePaths) => {
        const program = (0, parser_1.parse)(code, context);
        if (program === undefined) {
            throw utils_1.parseCodeError;
        }
        expect((0, preprocessor_1.getImportedLocalModulePaths)(program, baseFilePath)).toEqual(new Set(expectedModulePaths));
    };
    it('throws an error if the current file path is not absolute', () => {
        const code = '';
        const program = (0, parser_1.parse)(code, context);
        if (program === undefined) {
            throw utils_1.parseCodeError;
        }
        expect(() => (0, preprocessor_1.getImportedLocalModulePaths)(program, 'a.js')).toThrowError("Current file path 'a.js' is not absolute.");
    });
    it('returns local (relative) module imports', () => {
        const code = `
      import { x } from "./dir2/b.js";
      import { y } from "../dir3/c.js";
    `;
        assertCorrectModulePathsAreReturned(code, '/dir/a.js', ['/dir/dir2/b.js', '/dir3/c.js']);
    });
    it('returns local (absolute) module imports', () => {
        const code = `
      import { x } from "/dir/dir2/b.js";
      import { y } from "/dir3/c.js";
    `;
        assertCorrectModulePathsAreReturned(code, '/dir/a.js', ['/dir/dir2/b.js', '/dir3/c.js']);
    });
    it('does not return Source module imports', () => {
        const code = `
      import { x } from "rune";
      import { y } from "sound";
    `;
        assertCorrectModulePathsAreReturned(code, '/dir/a.js', []);
    });
    it('gracefully handles overly long sequences of double dots (..)', () => {
        const code = `import { x } from "../../../../../../../../../b.js";
    `;
        assertCorrectModulePathsAreReturned(code, '/dir/a.js', ['/b.js']);
    });
    it('returns unique module paths', () => {
        const code = `
      import { a } from "./b.js";
      import { b } from "./b.js";
      import { c } from "./c.js";
      import { d } from "./c.js";
    `;
        assertCorrectModulePathsAreReturned(code, '/dir/a.js', ['/dir/b.js', '/dir/c.js']);
    });
});
describe('preprocessFileImports', () => {
    let actualContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    let expectedContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    beforeEach(() => {
        actualContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
        expectedContext = (0, context_1.mockContext)(types_1.Chapter.LIBRARY_PARSER);
    });
    const assertASTsAreEquivalent = (actualProgram, expectedCode) => {
        if (actualProgram === undefined) {
            throw utils_1.parseCodeError;
        }
        const expectedProgram = (0, parser_1.parse)(expectedCode, expectedContext);
        if (expectedProgram === undefined) {
            throw utils_1.parseCodeError;
        }
        expect((0, utils_1.stripLocationInfo)(actualProgram)).toEqual((0, utils_1.stripLocationInfo)(expectedProgram));
    };
    it('returns undefined if the entrypoint file does not exist', () => {
        const files = {
            '/a.js': '1 + 2;'
        };
        const actualProgram = (0, preprocessor_1.default)(files, '/non-existent-file.js', actualContext);
        expect(actualProgram).toBeUndefined();
    });
    it('returns the same AST if the entrypoint file does not contain import/export statements', () => {
        const files = {
            '/a.js': `
        function square(x) {
          return x * x;
        }
        square(5);
      `
        };
        const expectedCode = files['/a.js'];
        const actualProgram = (0, preprocessor_1.default)(files, '/a.js', actualContext);
        assertASTsAreEquivalent(actualProgram, expectedCode);
    });
    it('removes all export-related AST nodes', () => {
        const files = {
            '/a.js': `
        export const x = 42;
        export let y = 53;
        export function square(x) {
          return x * x;
        }
        export const id = x => x;
        export default function cube(x) {
          return x * x * x;
        }
      `
        };
        const expectedCode = `
      const x = 42;
      let y = 53;
      function square(x) {
       return x * x;
      }
      const id = x => x;
      function cube(x) {
       return x * x * x;
      }
    `;
        const actualProgram = (0, preprocessor_1.default)(files, '/a.js', actualContext);
        assertASTsAreEquivalent(actualProgram, expectedCode);
    });
    it('ignores Source module imports & removes all non-Source module import-related AST nodes in the preprocessed program', () => {
        const files = {
            '/a.js': `
        import d, { a, b, c } from "source-module";
        import w, { x, y, z } from "./not-source-module.js";
      `,
            '/not-source-module.js': `
        export const x = 1;
        export const y = 2;
        export const z = 3;
        export default function square(x) {
          return x * x;
        }
      `
        };
        const expectedCode = `
      import { a, b, c } from "source-module";

      function __$not$$dash$$source$$dash$$module$$dot$$js__() {
        const x = 1;
        const y = 2;
        const z = 3;
        function square(x) {
          return x * x;
        }

        return pair(square, list(pair("x", x), pair("y", y), pair("z", z)));
      }

      const ___$not$$dash$$source$$dash$$module$$dot$$js___ = __$not$$dash$$source$$dash$$module$$dot$$js__();

      const w = ${localImport_prelude_1.accessExportFunctionName}(___$not$$dash$$source$$dash$$module$$dot$$js___, "${localImport_prelude_1.defaultExportLookupName}");
      const x = ${localImport_prelude_1.accessExportFunctionName}(___$not$$dash$$source$$dash$$module$$dot$$js___, "x");
      const y = ${localImport_prelude_1.accessExportFunctionName}(___$not$$dash$$source$$dash$$module$$dot$$js___, "y");
      const z = ${localImport_prelude_1.accessExportFunctionName}(___$not$$dash$$source$$dash$$module$$dot$$js___, "z");
    `;
        const actualProgram = (0, preprocessor_1.default)(files, '/a.js', actualContext);
        assertASTsAreEquivalent(actualProgram, expectedCode);
    });
    it('collates Source module imports at the start of the top-level environment of the preprocessed program', () => {
        const files = {
            '/a.js': `
        import { b } from "./b.js";
        import { w, x } from "source-module";
        import { f, g } from "other-source-module";

        b;
      `,
            '/b.js': `
        import { square } from "./c.js";
        import { x, y } from "source-module";
        import { h } from "another-source-module";

        export const b = square(5);
      `,
            '/c.js': `
        import { x, y, z } from "source-module";

        export const square = x => x * x;
      `
        };
        const expectedCode = `
      import { w, x, y, z } from "source-module";
      import { f, g } from "other-source-module";
      import { h } from "another-source-module";

      function __$b$$dot$$js__(___$c$$dot$$js___) {
        const square = ${localImport_prelude_1.accessExportFunctionName}(___$c$$dot$$js___, "square");

        const b = square(5);

        return pair(null, list(pair("b", b)));
      }

      function __$c$$dot$$js__() {
        const square = x => x * x;

        return pair(null, list(pair("square", square)));
      }

      const ___$c$$dot$$js___ = __$c$$dot$$js__();
      const ___$b$$dot$$js___ = __$b$$dot$$js__(___$c$$dot$$js___);

      const b = ${localImport_prelude_1.accessExportFunctionName}(___$b$$dot$$js___, "b");

      b;
    `;
        const actualProgram = (0, preprocessor_1.default)(files, '/a.js', actualContext);
        assertASTsAreEquivalent(actualProgram, expectedCode);
    });
    it('returns CircularImportError if there are circular imports', () => {
        const files = {
            '/a.js': `
        import { b } from "./b.js";

        export const a = 1;
      `,
            '/b.js': `
        import { c } from "./c.js";

        export const b = 2;
      `,
            '/c.js': `
        import { a } from "./a.js";

        export const c = 3;
      `
        };
        (0, preprocessor_1.default)(files, '/a.js', actualContext);
        expect((0, index_1.parseError)(actualContext.errors)).toMatchInlineSnapshot(`"Circular import detected: '/a.js' -> '/b.js' -> '/c.js' -> '/a.js'."`);
    });
    it('returns CircularImportError if there are circular imports - verbose', () => {
        const files = {
            '/a.js': `
        import { b } from "./b.js";

        export const a = 1;
      `,
            '/b.js': `
        import { c } from "./c.js";

        export const b = 2;
      `,
            '/c.js': `
        import { a } from "./a.js";

        export const c = 3;
      `
        };
        (0, preprocessor_1.default)(files, '/a.js', actualContext);
        expect((0, index_1.parseError)(actualContext.errors, true)).toMatchInlineSnapshot(`
      "Circular import detected: '/a.js' -> '/b.js' -> '/c.js' -> '/a.js'.
      Break the circular import cycle by removing imports from any of the offending files.
      "
    `);
    });
    it('returns CircularImportError if there are self-imports', () => {
        const files = {
            '/a.js': `
        import { y } from "./a.js";
        const x = 1;
        export { x as y };
      `
        };
        (0, preprocessor_1.default)(files, '/a.js', actualContext);
        expect((0, index_1.parseError)(actualContext.errors)).toMatchInlineSnapshot(`"Circular import detected: '/a.js' -> '/a.js'."`);
    });
    it('returns CircularImportError if there are self-imports - verbose', () => {
        const files = {
            '/a.js': `
        import { y } from "./a.js";
        const x = 1;
        export { x as y };
      `
        };
        (0, preprocessor_1.default)(files, '/a.js', actualContext);
        expect((0, index_1.parseError)(actualContext.errors, true)).toMatchInlineSnapshot(`
      "Circular import detected: '/a.js' -> '/a.js'.
      Break the circular import cycle by removing imports from any of the offending files.
      "
    `);
    });
    it('returns a preprocessed program with all imports', () => {
        const files = {
            '/a.js': `
        import { a as x, b as y } from "./b.js";

        x + y;
      `,
            '/b.js': `
        import y, { square } from "./c.js";

        const a = square(y);
        const b = 3;
        export { a, b };
      `,
            '/c.js': `
        import { mysteryFunction } from "./d.js";

        const x = mysteryFunction(5);
        export function square(x) {
          return x * x;
        }
        export default x;
      `,
            '/d.js': `
        const addTwo = x => x + 2;
        export { addTwo as mysteryFunction };
      `
        };
        const expectedCode = `
      function __$b$$dot$$js__(___$c$$dot$$js___) {
        const y = ${localImport_prelude_1.accessExportFunctionName}(___$c$$dot$$js___, "${localImport_prelude_1.defaultExportLookupName}");
        const square = ${localImport_prelude_1.accessExportFunctionName}(___$c$$dot$$js___, "square");

        const a = square(y);
        const b = 3;

        return pair(null, list(pair("a", a), pair("b", b)));
      }

      function __$c$$dot$$js__(___$d$$dot$$js___) {
        const mysteryFunction = ${localImport_prelude_1.accessExportFunctionName}(___$d$$dot$$js___, "mysteryFunction");

        const x = mysteryFunction(5);
        function square(x) {
          return x * x;
        }

        return pair(x, list(pair("square", square)));
      }

      function __$d$$dot$$js__() {
        const addTwo = x => x + 2;

        return pair(null, list(pair("mysteryFunction", addTwo)));
      }

      const ___$d$$dot$$js___ = __$d$$dot$$js__();
      const ___$c$$dot$$js___ = __$c$$dot$$js__(___$d$$dot$$js___);
      const ___$b$$dot$$js___ = __$b$$dot$$js__(___$c$$dot$$js___);

      const x = ${localImport_prelude_1.accessExportFunctionName}(___$b$$dot$$js___, "a");
      const y = ${localImport_prelude_1.accessExportFunctionName}(___$b$$dot$$js___, "b");

      x + y;
    `;
        const actualProgram = (0, preprocessor_1.default)(files, '/a.js', actualContext);
        assertASTsAreEquivalent(actualProgram, expectedCode);
    });
});
//# sourceMappingURL=preprocessor.js.map