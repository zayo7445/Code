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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullJSRunner = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const astring_1 = require("astring");
const constants_1 = require("../constants");
const runtimeSourceError_1 = require("../errors/runtimeSourceError");
const hoistAndMergeImports_1 = require("../localImports/transformers/hoistAndMergeImports");
const parser_1 = require("../parser/parser");
const transpiler_1 = require("../transpiler/transpiler");
const create = require("../utils/astCreator");
const errors_1 = require("./errors");
const utils_1 = require("./utils");
function fullJSEval(code, _a) {
    var { nativeStorage } = _a, ctx = __rest(_a, ["nativeStorage"]);
    if (nativeStorage.evaller) {
        return nativeStorage.evaller(code);
    }
    else {
        return eval(code);
    }
}
function preparePrelude(context) {
    if (context.prelude === null) {
        return [];
    }
    const prelude = context.prelude;
    context.prelude = null;
    const program = (0, parser_1.parse)(prelude, context);
    if (program === undefined) {
        return undefined;
    }
    return program.body;
}
function containsPrevEval(context) {
    return context.nativeStorage.evaller != null;
}
function fullJSRunner(program, context, options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        // prelude & builtins
        // only process builtins and preludes if it is a fresh eval context
        const prelude = preparePrelude(context);
        if (prelude === undefined) {
            return utils_1.resolvedErrorPromise;
        }
        const preludeAndBuiltins = containsPrevEval(context)
            ? []
            : [...(0, transpiler_1.getBuiltins)(context.nativeStorage), ...prelude];
        // modules
        (0, hoistAndMergeImports_1.hoistAndMergeImports)(program);
        (0, utils_1.appendModulesToContext)(program, context);
        // evaluate and create a separate block for preludes and builtins
        const preEvalProgram = create.program([
            ...preludeAndBuiltins,
            (0, transpiler_1.evallerReplacer)(create.identifier(constants_1.NATIVE_STORAGE_ID), new Set())
        ]);
        const preEvalCode = (0, astring_1.generate)(preEvalProgram);
        yield fullJSEval(preEvalCode, context);
        let transpiled;
        let sourceMapJson;
        try {
            ;
            ({ transpiled, sourceMapJson } = (0, transpiler_1.transpile)(program, context));
            return Promise.resolve({
                status: 'finished',
                context,
                value: yield fullJSEval(transpiled, context)
            });
        }
        catch (error) {
            context.errors.push(error instanceof runtimeSourceError_1.RuntimeSourceError ? error : yield (0, errors_1.toSourceError)(error, sourceMapJson));
            return utils_1.resolvedErrorPromise;
        }
    });
}
exports.fullJSRunner = fullJSRunner;
//# sourceMappingURL=fullJSRunner.js.map