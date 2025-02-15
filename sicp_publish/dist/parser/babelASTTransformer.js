"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformBabelASTToESTreeCompliantAST = void 0;
/**
 * Transforms an AST generated by the Babel parser into one
 * that is compliant with the ESTree types. While the Babel
 * parser-generated AST is mostly compliant with the ESTree
 * specifications due to the use of the 'estree' plugin, not
 * everything is compliant with the ESTree types.
 *
 * @param program The AST to be transformed.
 */
const transformBabelASTToESTreeCompliantAST = (program) => {
    renameFilenameAttributeToSource(program);
};
exports.transformBabelASTToESTreeCompliantAST = transformBabelASTToESTreeCompliantAST;
/**
 * Renames the 'filename' attribute on AST nodes to 'source'.
 * This is because the Babel parser tags AST nodes with the
 * 'filename' attribute when the name of the file in which
 * the AST was generated from is given. However, by the ESTree
 * types that js-slang uses, this attribute should be named
 * 'source' instead of 'filename'. As a workaround, we
 * recursively walk the AST generated by the Babel parser and
 * replace all instances of the 'filename' attribute with
 * 'source'.
 *
 * Note that we do not use acorn-walk here as a precondition
 * of acorn-walk is that the AST is compliant with the ESTree
 * specifications. Since the reason why we are transforming
 * the AST generated by the Babel parser is because it is not
 * entirely compliant with the ESTree specifications in the
 * first place, we avoid the use of acorn-walk.
 *
 * @param node The node to be transformed.
 */
const renameFilenameAttributeToSource = (node) => {
    // Rename all 'filename' attributes to 'source'.
    if (node.hasOwnProperty('filename')) {
        node.source = node.filename;
        delete node.filename;
    }
    // Iterate over all property values of the AST node.
    Object.values(node).forEach(value => {
        // If the value is null or undefined, do nothing.
        if (value === null || value === undefined) {
            return;
        }
        // If the value is an array, check if any of its elements
        // are objects (i.e., AST nodes) which we should recurse on.
        if (Array.isArray(value)) {
            value.forEach(element => {
                if (element === null || element === undefined) {
                    return;
                }
                if (typeof element !== 'object') {
                    return;
                }
                renameFilenameAttributeToSource(element);
            });
        }
        // If the value is a primitive type, do nothing.
        if (typeof value !== 'object') {
            return;
        }
        // Otherwise, the value is an object (i.e., AST node) which
        // we recurse on.
        renameFilenameAttributeToSource(value);
    });
};
//# sourceMappingURL=babelASTTransformer.js.map