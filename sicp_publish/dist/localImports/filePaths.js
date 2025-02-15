"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFilePath = exports.validateFilePath = exports.transformFunctionNameToInvokedFunctionResultVariableName = exports.transformFilePathToValidFunctionName = exports.nonAlphanumericCharEncoding = void 0;
const localImportErrors_1 = require("../errors/localImportErrors");
/**
 * Maps non-alphanumeric characters that are legal in file paths
 * to strings which are legal in function names.
 */
exports.nonAlphanumericCharEncoding = {
    // While the underscore character is legal in both file paths
    // and function names, it is the only character to be legal
    // in both that is not an alphanumeric character. For simplicity,
    // we handle it the same way as the other non-alphanumeric
    // characters.
    _: '_',
    '/': '$',
    // The following encodings work because we disallow file paths
    // with consecutive slash characters (//). Note that when using
    // the 'replace' or 'replaceAll' functions, the dollar sign ($)
    // takes on a special meaning. As such, to insert a dollar sign,
    // we need to write '$$'. See
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement
    // for more information.
    '.': '$$$$dot$$$$',
    '-': '$$$$dash$$$$' // '$$dash$$'
};
/**
 * Transforms the given file path to a valid function name. The
 * characters in a valid function name must be either an
 * alphanumeric character, the underscore (_), or the dollar ($).
 *
 * In addition, the returned function name has underscores appended
 * on both ends to make it even less likely that the function name
 * will collide with a user-inputted name.
 *
 * @param filePath The file path to transform.
 */
const transformFilePathToValidFunctionName = (filePath) => {
    const encodeChars = Object.entries(exports.nonAlphanumericCharEncoding).reduce((accumulatedFunction, [charToReplace, replacementString]) => {
        return (filePath) => accumulatedFunction(filePath).replaceAll(charToReplace, replacementString);
    }, (filePath) => filePath);
    return `__${encodeChars(filePath)}__`;
};
exports.transformFilePathToValidFunctionName = transformFilePathToValidFunctionName;
/**
 * Transforms the given function name to the expected name that
 * the variable holding the result of invoking the function should
 * have. The main consideration of this transformation is that
 * the resulting name should not conflict with any of the names
 * that can be generated by `transformFilePathToValidFunctionName`.
 *
 * @param functionName The function name to transform.
 */
const transformFunctionNameToInvokedFunctionResultVariableName = (functionName) => {
    return `_${functionName}_`;
};
exports.transformFunctionNameToInvokedFunctionResultVariableName = transformFunctionNameToInvokedFunctionResultVariableName;
const isAlphanumeric = (char) => {
    return /[a-zA-Z0-9]/i.exec(char) !== null;
};
/**
 * Validates the given file path, returning an `InvalidFilePathError`
 * if the file path is invalid & `null` otherwise. A file path is
 * valid if it only contains alphanumeric characters and the characters
 * defined in `charEncoding`, and does not contain consecutive slash
 * characters (//).
 *
 * @param filePath The file path to check.
 */
const validateFilePath = (filePath) => {
    if (filePath.includes('//')) {
        return new localImportErrors_1.ConsecutiveSlashesInFilePathError(filePath);
    }
    for (const char of filePath) {
        if (isAlphanumeric(char)) {
            continue;
        }
        if (char in exports.nonAlphanumericCharEncoding) {
            continue;
        }
        return new localImportErrors_1.IllegalCharInFilePathError(filePath);
    }
    return null;
};
exports.validateFilePath = validateFilePath;
/**
 * Returns whether a string is a file path. We define a file
 * path to be any string containing the '/' character.
 *
 * @param value The value of the string.
 */
const isFilePath = (value) => {
    return value.includes('/');
};
exports.isFilePath = isFilePath;
//# sourceMappingURL=filePaths.js.map