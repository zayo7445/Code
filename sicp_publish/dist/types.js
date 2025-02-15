"use strict";
/*
    This file contains definitions of some interfaces and classes that are used in Source (such as
    error-related classes).
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.disallowedTypes = exports.Variant = exports.Chapter = exports.ErrorSeverity = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["SYNTAX"] = "Syntax";
    ErrorType["TYPE"] = "Type";
    ErrorType["RUNTIME"] = "Runtime";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["WARNING"] = "Warning";
    ErrorSeverity["ERROR"] = "Error";
})(ErrorSeverity = exports.ErrorSeverity || (exports.ErrorSeverity = {}));
var Chapter;
(function (Chapter) {
    Chapter[Chapter["SOURCE_1"] = 1] = "SOURCE_1";
    Chapter[Chapter["SOURCE_2"] = 2] = "SOURCE_2";
    Chapter[Chapter["SOURCE_3"] = 3] = "SOURCE_3";
    Chapter[Chapter["SOURCE_4"] = 4] = "SOURCE_4";
    Chapter[Chapter["FULL_JS"] = -1] = "FULL_JS";
    Chapter[Chapter["HTML"] = -2] = "HTML";
    Chapter[Chapter["LIBRARY_PARSER"] = 100] = "LIBRARY_PARSER";
})(Chapter = exports.Chapter || (exports.Chapter = {}));
var Variant;
(function (Variant) {
    Variant["DEFAULT"] = "default";
    Variant["TYPED"] = "typed";
    Variant["NATIVE"] = "native";
    Variant["WASM"] = "wasm";
    Variant["LAZY"] = "lazy";
    Variant["NON_DET"] = "non-det";
    Variant["CONCURRENT"] = "concurrent";
    Variant["GPU"] = "gpu";
})(Variant = exports.Variant || (exports.Variant = {}));
exports.disallowedTypes = ['bigint', 'never', 'object', 'symbol', 'unknown'];
//# sourceMappingURL=types.js.map