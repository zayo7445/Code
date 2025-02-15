"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../../mocks/context");
const parser_1 = require("../../parser/parser");
const types_1 = require("../../types");
const formatters_1 = require("../../utils/formatters");
const transpiler_1 = require("../transpiler");
jest.mock('../../modules/moduleLoader', () => (Object.assign(Object.assign({}, jest.requireActual('../../modules/moduleLoader')), { memoizedGetModuleFile: () => 'undefined;' })));
test('Transform import declarations into variable declarations', () => {
    const code = (0, formatters_1.stripIndent) `
    import { foo } from "test/one_module";
    import { bar } from "test/another_module";
    foo(bar);
  `;
    const context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    const program = (0, parser_1.parse)(code, context);
    const [, importNodes] = (0, transpiler_1.transformImportDeclarations)(program, new Set());
    expect(importNodes[0].type).toBe('VariableDeclaration');
    expect(importNodes[0].declarations[0].id.name).toEqual('foo');
    expect(importNodes[1].type).toBe('VariableDeclaration');
    expect(importNodes[1].declarations[0].id.name).toEqual('bar');
});
test('Transpiler accounts for user variable names when transforming import statements', () => {
    const code = (0, formatters_1.stripIndent) `
    import { foo } from "test/one_module";
    import { bar } from "test/another_module";
    const __MODULE_0__ = 'test0';
    const __MODULE_2__ = 'test1';
    foo(bar);
  `;
    const context = (0, context_1.mockContext)(4);
    const program = (0, parser_1.parse)(code, context);
    const [, importNodes, [varDecl0, varDecl1]] = (0, transpiler_1.transformImportDeclarations)(program, new Set(['__MODULE_0__', '__MODULE_2__']));
    expect(importNodes[0].type).toBe('VariableDeclaration');
    expect(importNodes[0].declarations[0].init.object.name).toEqual('__MODULE_1__');
    expect(varDecl0.type).toBe('VariableDeclaration');
    expect(varDecl0.declarations[0].init.value).toEqual('test0');
    expect(varDecl1.type).toBe('VariableDeclaration');
    expect(varDecl1.declarations[0].init.value).toEqual('test1');
    expect(importNodes[1].type).toBe('VariableDeclaration');
    expect(importNodes[1].declarations[0].init.object.name).toEqual('__MODULE_3__');
});
test('checkForUndefinedVariables accounts for import statements', () => {
    const code = (0, formatters_1.stripIndent) `
    import { hello } from "module";
    hello;
  `;
    const context = (0, context_1.mockContext)(types_1.Chapter.SOURCE_4);
    const program = (0, parser_1.parse)(code, context);
    (0, transpiler_1.transpile)(program, context, false);
});
//# sourceMappingURL=modules.js.map