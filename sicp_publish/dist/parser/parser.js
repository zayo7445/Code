"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typedParse = exports.looseParse = exports.parseWithComments = exports.createAcornParserOptions = exports.tokenize = exports.parse = exports.parseAt = exports.TrailingCommaError = exports.MissingSemicolonError = exports.FatalSyntaxError = exports.DisallowedConstructError = void 0;
/* tslint:disable:max-classes-per-file */
const parser_1 = require("@babel/parser");
const acorn_1 = require("acorn");
const acorn_loose_1 = require("acorn-loose");
const constants_1 = require("../constants");
const typeErrorChecker_1 = require("../typeChecker/typeErrorChecker");
const types_1 = require("../types");
const formatters_1 = require("../utils/formatters");
const walkers_1 = require("../utils/walkers");
const validator_1 = require("../validator/validator");
const babelASTTransformer_1 = require("./babelASTTransformer");
const rules_1 = require("./rules");
const syntaxBlacklist_1 = require("./syntaxBlacklist");
const typeParser_1 = require("./typeParser");
class DisallowedConstructError {
    constructor(node) {
        this.node = node;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
        this.nodeType = this.formatNodeType(this.node.type);
    }
    get location() {
        return this.node.loc;
    }
    explain() {
        return `${this.nodeType} are not allowed`;
    }
    elaborate() {
        return (0, formatters_1.stripIndent) `
      You are trying to use ${this.nodeType}, which is not allowed (yet).
    `;
    }
    /**
     * Converts estree node.type into english
     * e.g. ThisExpression -> 'this' expressions
     *      Property -> Properties
     *      EmptyStatement -> Empty Statements
     */
    formatNodeType(nodeType) {
        switch (nodeType) {
            case 'ThisExpression':
                return "'this' expressions";
            case 'Property':
                return 'Properties';
            case 'ImportNamespaceSpecifier':
                return 'Namespace imports';
            default: {
                const words = nodeType.split(/(?=[A-Z])/);
                return words.map((word, i) => (i === 0 ? word : word.toLowerCase())).join(' ') + 's';
            }
        }
    }
}
exports.DisallowedConstructError = DisallowedConstructError;
class FatalSyntaxError {
    constructor(location, message) {
        this.location = location;
        this.message = message;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return this.message;
    }
    elaborate() {
        return 'There is a syntax error in your program';
    }
}
exports.FatalSyntaxError = FatalSyntaxError;
class MissingSemicolonError {
    constructor(location) {
        this.location = location;
        this.type = types_1.ErrorType.SYNTAX;
        this.severity = types_1.ErrorSeverity.ERROR;
    }
    explain() {
        return 'Missing semicolon at the end of statement';
    }
    elaborate() {
        return 'Every statement must be terminated by a semicolon.';
    }
}
exports.MissingSemicolonError = MissingSemicolonError;
class TrailingCommaError {
    constructor(location) {
        this.location = location;
    }
    explain() {
        return 'Trailing comma';
    }
    elaborate() {
        return 'Please remove the trailing comma';
    }
}
exports.TrailingCommaError = TrailingCommaError;
function parseAt(source, num) {
    let theNode;
    try {
        theNode = (0, acorn_1.parseExpressionAt)(source, num, constants_1.ACORN_PARSE_OPTIONS);
    }
    catch (error) {
        return undefined;
    }
    return theNode;
}
exports.parseAt = parseAt;
const FULL_JS_PARSER_OPTIONS = {
    sourceType: 'module',
    ecmaVersion: 'latest',
    locations: true
};
function parse(source, context, options = {}) {
    let program;
    const acornParserOptions = (0, exports.createAcornParserOptions)(context, options);
    try {
        if (context.variant === types_1.Variant.TYPED) {
            // The code is first parsed using the custom TypeParser (Acorn parser with plugin that allows for parsing of TS syntax)
            // in order to catch syntax errors such as no semicolon/trailing comma.
            typeParser_1.default.parse(source, acornParserOptions);
            // The code is then parsed using Babel Parser to successfully parse all type syntax.
            // This is a workaround as the custom TypeParser does not cover all type annotation cases needed for Source Typed
            // and the Babel Parser does not allow for no semicolon/trailing comma errors when parsing.
            // The final type is casted to a cloned version of esTree AST type that supports type syntax.
            // Babel types are not used as the babel AST is different from the esTree AST,
            // and though the 'estree' plugin is used here to revert the changes, the changes are not reflected in the types.
            const typedProgram = (0, parser_1.parse)(source, {
                sourceType: 'module',
                plugins: ['typescript', 'estree'],
                sourceFilename: options.sourceFile
            }).program;
            // Checks for type errors, then removes any TS-related nodes as they are not compatible with acorn-walk.
            program = (0, typeErrorChecker_1.checkForTypeErrors)(typedProgram, context);
            // Transform the AST generated by the Babel parser into one that is compliant with the ESTree types.
            (0, babelASTTransformer_1.transformBabelASTToESTreeCompliantAST)(program);
        }
        else if (context.chapter === types_1.Chapter.FULL_JS ||
            (context.executionMethod === 'native' && context.variant === types_1.Variant.NATIVE)) {
            // Do not enforce Source rules on JavaScript code.
            return (0, acorn_1.parse)(source, Object.assign(Object.assign({}, FULL_JS_PARSER_OPTIONS), options));
        }
        else {
            program = (0, acorn_1.parse)(source, acornParserOptions);
        }
        (0, walkers_1.ancestor)(program, walkers, undefined, context);
    }
    catch (error) {
        if (error instanceof SyntaxError) {
            // tslint:disable-next-line:no-any
            const loc = error.loc;
            const location = {
                start: { line: loc.line, column: loc.column },
                end: { line: loc.line, column: loc.column + 1 },
                source: acornParserOptions.sourceFile
            };
            context.errors.push(new FatalSyntaxError(location, error.toString()));
        }
        else {
            throw error;
        }
    }
    const hasErrors = context.errors.find(m => m.severity === types_1.ErrorSeverity.ERROR);
    if (program && !hasErrors) {
        return program;
    }
    else {
        return undefined;
    }
}
exports.parse = parse;
function tokenize(source, context) {
    return [...(0, acorn_1.tokenizer)(source, (0, exports.createAcornParserOptions)(context))];
}
exports.tokenize = tokenize;
const createAcornParserOptions = (context, options = {}) => (Object.assign({ sourceType: 'module', ecmaVersion: 6, locations: true, 
    // tslint:disable-next-line:no-any
    onInsertedSemicolon(end, loc) {
        context.errors.push(new MissingSemicolonError({
            end: { line: loc.line, column: loc.column + 1 },
            start: loc,
            source: options.sourceFile
        }));
    },
    // tslint:disable-next-line:no-any
    onTrailingComma(end, loc) {
        context.errors.push(new TrailingCommaError({
            end: { line: loc.line, column: loc.column + 1 },
            start: loc,
            source: options.sourceFile
        }));
    } }, options));
exports.createAcornParserOptions = createAcornParserOptions;
// Names-extractor needs comments
/**
 * Parse a program, returning alongside comments found within that program
 * @param source Code to parse for comments
 * @returns Tuple consisting of the parsed program, and a list of comments found
 * within the code
 */
function parseWithComments(source) {
    let comments = [];
    const options = {
        sourceType: 'module',
        ecmaVersion: 6,
        locations: true,
        onComment: comments
    };
    let program;
    try {
        program = (0, acorn_1.parse)(source, options);
    }
    catch (_a) {
        comments = [];
        program = (0, acorn_loose_1.parse)(source, options);
    }
    return [program, comments];
}
exports.parseWithComments = parseWithComments;
function looseParse(source, context) {
    const program = (0, acorn_loose_1.parse)(source, (0, exports.createAcornParserOptions)(context));
    return program;
}
exports.looseParse = looseParse;
function typedParse(code, context) {
    const program = looseParse(code, context);
    if (program === undefined) {
        return null;
    }
    return (0, validator_1.validateAndAnnotate)(program, context);
}
exports.typedParse = typedParse;
function createWalkers(allowedSyntaxes, parserRules) {
    const newWalkers = new Map();
    const visitedNodes = new Set();
    // Provide callbacks checking for disallowed syntaxes, such as case, switch...
    const syntaxPairs = Object.entries(allowedSyntaxes);
    syntaxPairs.map(pair => {
        const syntax = pair[0];
        newWalkers.set(syntax, (node, context, _ancestors) => {
            if (!visitedNodes.has(node)) {
                visitedNodes.add(node);
                if (context.chapter < allowedSyntaxes[node.type]) {
                    context.errors.push(new DisallowedConstructError(node));
                }
            }
        });
    });
    // Provide callbacks checking for rule violations, e.g. no block arrow funcs, nonempty lists...
    parserRules.forEach(rule => {
        const checkers = rule.checkers;
        const syntaxCheckerPair = Object.entries(checkers);
        syntaxCheckerPair.forEach(pair => {
            const syntax = pair[0];
            const checker = pair[1];
            const oldCheck = newWalkers.get(syntax);
            const newCheck = (node, context, ancestors) => {
                if (rule.disableFromChapter && context.chapter >= rule.disableFromChapter) {
                    return;
                }
                if (rule.disableForVariants && rule.disableForVariants.includes(context.variant)) {
                    return;
                }
                const errors = checker(node, ancestors);
                errors.forEach(e => context.errors.push(e));
            };
            newWalkers.set(syntax, (node, context, ancestors) => {
                oldCheck(node, context, ancestors);
                newCheck(node, context, ancestors);
            });
        });
    });
    return mapToObj(newWalkers);
}
const mapToObj = (map) => Array.from(map).reduce((obj, [k, v]) => Object.assign(obj, { [k]: v }), {});
const walkers = createWalkers(syntaxBlacklist_1.default, rules_1.default);
//# sourceMappingURL=parser.js.map