"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const context_1 = require("../../mocks/context");
const parser_1 = require("../../parser/parser");
const types_1 = require("../../types");
let context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4, types_1.Variant.TYPED);
beforeEach(() => {
    context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4, types_1.Variant.TYPED);
});
describe('parse', () => {
    it('takes in string', () => {
        const code = `const x1 = parse('1;');
      const x2 = parse(1);
    `;
        (0, parser_1.parse)(code, context);
        expect((0, __1.parseError)(context.errors)).toMatchInlineSnapshot(`"Line 2: Type 'number' is not assignable to type 'string'."`);
    });
});
//# sourceMappingURL=source4Typed.test.js.map