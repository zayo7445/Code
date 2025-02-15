"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForTypeErrors = void 0;
const lodash_1 = require("lodash");
const moduleErrors_1 = require("../errors/moduleErrors");
const typeErrors_1 = require("../errors/typeErrors");
const moduleLoader_1 = require("../modules/moduleLoader");
const types_1 = require("../types");
const internalTypeErrors_1 = require("./internalTypeErrors");
const utils_1 = require("./utils");
// Type environment is saved as a global variable so that it is not passed between functions excessively
let env = [];
/**
 * Entry function for type error checker.
 * Checks program for type errors, and returns the program with all TS-related nodes removed.
 */
function checkForTypeErrors(program, context) {
    // Deep copy type environment to avoid modifying type environment in the context,
    // which might affect the type inference checker
    env = (0, lodash_1.cloneDeep)(context.typeEnvironment);
    // Override predeclared function types
    for (const [name, type] of (0, utils_1.getTypeOverrides)(context.chapter)) {
        (0, utils_1.setType)(name, type, env);
    }
    try {
        typeCheckAndReturnType(program, context);
    }
    catch (error) {
        // Catch-all for thrown errors
        // (either errors that cause early termination or errors that should not be reached logically)
        console.error(error);
        context.errors.push(error instanceof internalTypeErrors_1.TypecheckError
            ? error
            : new internalTypeErrors_1.TypecheckError(program, 'Uncaught error during typechecking, report this to the administrators!\n' +
                error.message));
    }
    // Reset global variables
    env = [];
    return removeTSNodes(program);
}
exports.checkForTypeErrors = checkForTypeErrors;
/**
 * Recurses through the given node to check for any type errors,
 * then returns the node's inferred/declared type.
 * Any errors found are added to the context.
 */
function typeCheckAndReturnType(node, context) {
    var _a;
    switch (node.type) {
        case 'Literal': {
            // Infers type
            if (node.value === undefined) {
                return utils_1.tUndef;
            }
            if (node.value === null) {
                // For Source 1, skip typecheck as null literals will be handled by the noNull rule,
                // which is run after typechecking
                return context.chapter === types_1.Chapter.SOURCE_1 ? utils_1.tAny : utils_1.tNull;
            }
            if (typeof node.value !== 'string' &&
                typeof node.value !== 'number' &&
                typeof node.value !== 'boolean') {
                // Skip typecheck as unspecified literals will be handled by the noUnspecifiedLiteral rule,
                // which is run after typechecking
                return utils_1.tAny;
            }
            // Casting is safe here as above check already narrows type to string, number or boolean
            return (0, utils_1.tPrimitive)(typeof node.value, node.value);
        }
        case 'Identifier': {
            const varName = node.name;
            const varType = lookupTypeAndRemoveForAllAndPredicateTypes(varName);
            if (varType) {
                return varType;
            }
            else {
                context.errors.push(new typeErrors_1.UndefinedVariableTypeError(node, varName));
                return utils_1.tAny;
            }
        }
        case 'RestElement':
        case 'SpreadElement':
            // TODO: Add support for rest and spread element
            return utils_1.tAny;
        case 'Program':
        case 'BlockStatement': {
            let returnType = utils_1.tVoid;
            (0, utils_1.pushEnv)(env);
            if (node.type === 'Program') {
                // Import statements should only exist in program body
                handleImportDeclarations(node, context);
            }
            // Add all declarations in the current scope to the environment first
            addTypeDeclarationsToEnvironment(node, context);
            // Check all statements in program/block body
            for (const stmt of node.body) {
                if (stmt.type === 'IfStatement' || stmt.type === 'ReturnStatement') {
                    returnType = typeCheckAndReturnType(stmt, context);
                    if (stmt.type === 'ReturnStatement') {
                        // If multiple return statements are present, only take the first type
                        break;
                    }
                }
                else {
                    typeCheckAndReturnType(stmt, context);
                }
            }
            if (node.type === 'BlockStatement') {
                // Types are saved for programs, but not for blocks
                env.pop();
            }
            return returnType;
        }
        case 'ExpressionStatement': {
            // Check expression
            return typeCheckAndReturnType(node.expression, context);
        }
        case 'ConditionalExpression':
        case 'IfStatement': {
            // Predicate type must be boolean/any
            const predicateType = typeCheckAndReturnType(node.test, context);
            checkForTypeMismatch(node, predicateType, utils_1.tBool, context);
            // Return type is union of consequent and alternate type
            const consType = typeCheckAndReturnType(node.consequent, context);
            const altType = node.alternate ? typeCheckAndReturnType(node.alternate, context) : utils_1.tUndef;
            return mergeTypes(consType, altType);
        }
        case 'UnaryExpression': {
            const argType = typeCheckAndReturnType(node.argument, context);
            const operator = node.operator;
            switch (operator) {
                case '-':
                    // Only number/any type allowed
                    checkForTypeMismatch(node, argType, utils_1.tNumber, context);
                    return utils_1.tNumber;
                case '!':
                    // Only boolean/any type allowed
                    checkForTypeMismatch(node, argType, utils_1.tBool, context);
                    return utils_1.tBool;
                case 'typeof':
                    // No checking needed, typeof operation can be used on any type
                    return utils_1.tString;
                default:
                    throw new internalTypeErrors_1.TypecheckError(node, 'Unknown operator');
            }
        }
        case 'BinaryExpression': {
            return typeCheckAndReturnBinaryExpressionType(node, context);
        }
        case 'LogicalExpression': {
            // Left type must be boolean/any
            const leftType = typeCheckAndReturnType(node.left, context);
            checkForTypeMismatch(node, leftType, utils_1.tBool, context);
            // Return type is union of boolean and right type
            const rightType = typeCheckAndReturnType(node.right, context);
            return mergeTypes(utils_1.tBool, rightType);
        }
        case 'ArrowFunctionExpression': {
            return typeCheckAndReturnArrowFunctionType(node, context);
        }
        case 'FunctionDeclaration':
            if (node.id === null) {
                // Block should not be reached since node.id is only null when function declaration
                // is part of `export default function`, which is not used in Source
                throw new internalTypeErrors_1.TypecheckError(node, 'Function declaration should always have an identifier');
            }
            // Only identifiers/rest elements are used as function params in Source
            const params = node.params.filter((param) => param.type === 'Identifier' || param.type === 'RestElement');
            if (params.length !== node.params.length) {
                throw new internalTypeErrors_1.TypecheckError(node, 'Unknown function parameter type');
            }
            const fnName = node.id.name;
            const expectedReturnType = getTypeAnnotationType(node.returnType, context);
            // If the function has variable number of arguments, set function type as any
            // TODO: Add support for variable number of function arguments
            const hasVarArgs = params.reduce((prev, curr) => prev || curr.type === 'RestElement', false);
            if (hasVarArgs) {
                (0, utils_1.setType)(fnName, utils_1.tAny, env);
                return utils_1.tUndef;
            }
            const types = getParamTypes(params, context);
            // Return type will always be last item in types array
            types.push(expectedReturnType);
            const fnType = (0, utils_1.tFunc)(...types);
            // Type check function body, creating new environment to store arg types, return type and function type
            (0, utils_1.pushEnv)(env);
            params.forEach((param) => {
                (0, utils_1.setType)(param.name, getTypeAnnotationType(param.typeAnnotation, context), env);
            });
            // Set unique identifier so that typechecking can be carried out for return statements
            (0, utils_1.setType)(utils_1.RETURN_TYPE_IDENTIFIER, expectedReturnType, env);
            (0, utils_1.setType)(fnName, fnType, env);
            const actualReturnType = typeCheckAndReturnType(node.body, context);
            env.pop();
            if ((0, lodash_1.isEqual)(actualReturnType, utils_1.tVoid) &&
                !(0, lodash_1.isEqual)(expectedReturnType, utils_1.tAny) &&
                !(0, lodash_1.isEqual)(expectedReturnType, utils_1.tVoid)) {
                // Type error where function does not return anything when it should
                context.errors.push(new typeErrors_1.FunctionShouldHaveReturnValueError(node));
            }
            else {
                checkForTypeMismatch(node, actualReturnType, expectedReturnType, context);
            }
            // Save function type in type env
            (0, utils_1.setType)(fnName, fnType, env);
            return utils_1.tUndef;
        case 'VariableDeclaration': {
            if (node.kind === 'var') {
                throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration using "var" is not allowed');
            }
            if (node.declarations.length !== 1) {
                throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration should have one and only one declaration');
            }
            if (node.declarations[0].id.type !== 'Identifier') {
                throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration ID should be an identifier');
            }
            const id = node.declarations[0].id;
            if (!node.declarations[0].init) {
                throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration must have value');
            }
            const init = node.declarations[0].init;
            // Look up declared type if current environment contains name
            const expectedType = env[env.length - 1].typeMap.has(id.name)
                ? (_a = lookupTypeAndRemoveForAllAndPredicateTypes(id.name)) !== null && _a !== void 0 ? _a : getTypeAnnotationType(id.typeAnnotation, context)
                : getTypeAnnotationType(id.typeAnnotation, context);
            const initType = typeCheckAndReturnType(init, context);
            checkForTypeMismatch(node, initType, expectedType, context);
            // Save variable type and decl kind in type env
            (0, utils_1.setType)(id.name, expectedType, env);
            (0, utils_1.setDeclKind)(id.name, node.kind, env);
            return utils_1.tUndef;
        }
        case 'CallExpression': {
            const callee = node.callee;
            const args = node.arguments;
            if (context.chapter >= 2 && callee.type === 'Identifier') {
                // Special functions for Source 2+: list, head, tail, stream
                // The typical way of getting the return type of call expressions is insufficient to type lists,
                // as we need to save the pair representation of the list as well (lists are pairs).
                // head and tail should preserve the pair representation of lists whenever possible.
                // Hence, these 3 functions are handled separately.
                // Streams are treated similarly to lists, except only for Source 3+ and we do not need to store the pair representation.
                const fnName = callee.name;
                if (fnName === 'list') {
                    if (args.length === 0) {
                        return utils_1.tNull;
                    }
                    // Element type is union of all types of arguments in list
                    let elementType = typeCheckAndReturnType(args[0], context);
                    for (let i = 1; i < args.length; i++) {
                        elementType = mergeTypes(elementType, typeCheckAndReturnType(args[i], context));
                    }
                    // Type the list as a pair, for use when checking for type mismatches against pairs
                    let pairType = (0, utils_1.tPair)(typeCheckAndReturnType(args[args.length - 1], context), utils_1.tNull);
                    for (let i = args.length - 2; i >= 0; i--) {
                        pairType = (0, utils_1.tPair)(typeCheckAndReturnType(args[i], context), pairType);
                    }
                    return (0, utils_1.tList)(elementType, pairType);
                }
                if (fnName === 'head' || fnName === 'tail') {
                    if (args.length !== 1) {
                        context.errors.push(new typeErrors_1.InvalidNumberOfArgumentsTypeError(node, 1, args.length));
                        return utils_1.tAny;
                    }
                    const actualType = typeCheckAndReturnType(args[0], context);
                    // Argument should be either a pair or a list
                    const expectedType = (0, utils_1.tUnion)((0, utils_1.tPair)(utils_1.tAny, utils_1.tAny), (0, utils_1.tList)(utils_1.tAny));
                    const numErrors = context.errors.length;
                    checkForTypeMismatch(node, actualType, expectedType, context);
                    if (context.errors.length > numErrors) {
                        // If errors were found, return "any" type
                        return utils_1.tAny;
                    }
                    if (actualType.kind === 'pair') {
                        return fnName === 'head' ? actualType.headType : actualType.tailType;
                    }
                    if (actualType.kind === 'list') {
                        return fnName === 'head'
                            ? actualType.elementType
                            : (0, utils_1.tList)(actualType.elementType, actualType.typeAsPair && actualType.typeAsPair.tailType.kind === 'pair'
                                ? actualType.typeAsPair.tailType
                                : undefined);
                    }
                    return actualType;
                }
                if (fnName === 'stream' && context.chapter >= 3) {
                    if (args.length === 0) {
                        return utils_1.tNull;
                    }
                    // Element type is union of all types of arguments in stream
                    let elementType = typeCheckAndReturnType(args[0], context);
                    for (let i = 1; i < args.length; i++) {
                        elementType = mergeTypes(elementType, typeCheckAndReturnType(args[i], context));
                    }
                    return (0, utils_1.tStream)(elementType);
                }
            }
            const calleeType = typeCheckAndReturnType(callee, context);
            if (calleeType.kind !== 'function') {
                if (calleeType.kind !== 'primitive' || calleeType.name !== 'any') {
                    context.errors.push(new typeErrors_1.TypeNotCallableError(node, (0, utils_1.formatTypeString)(calleeType)));
                }
                return utils_1.tAny;
            }
            const expectedTypes = calleeType.parameterTypes;
            let returnType = calleeType.returnType;
            // If any of the arguments is a spread element, skip type checking of arguments
            // TODO: Add support for type checking of call expressions with spread elements
            const hasVarArgs = args.reduce((prev, curr) => prev || curr.type === 'SpreadElement', false);
            if (hasVarArgs) {
                return returnType;
            }
            // Check argument types before returning declared return type
            if (args.length !== expectedTypes.length) {
                context.errors.push(new typeErrors_1.InvalidNumberOfArgumentsTypeError(node, expectedTypes.length, args.length));
                return returnType;
            }
            for (let i = 0; i < expectedTypes.length; i++) {
                const node = args[i];
                const actualType = typeCheckAndReturnType(node, context);
                // Get all valid type variable mappings for current argument
                const mappings = getTypeVariableMappings(actualType, expectedTypes[i]);
                // Apply type variable mappings to subsequent argument types and return type
                for (const mapping of mappings) {
                    const typeVar = (0, utils_1.tVar)(mapping[0]);
                    const typeToSub = mapping[1];
                    for (let j = i; j < expectedTypes.length; j++) {
                        expectedTypes[j] = substituteVariableTypes(expectedTypes[j], typeVar, typeToSub);
                    }
                    returnType = substituteVariableTypes(returnType, typeVar, typeToSub);
                }
                // Typecheck current argument
                checkForTypeMismatch(node, actualType, expectedTypes[i], context);
            }
            return returnType;
        }
        case 'AssignmentExpression':
            const expectedType = typeCheckAndReturnType(node.left, context);
            const actualType = typeCheckAndReturnType(node.right, context);
            if (node.left.type === 'Identifier' && (0, utils_1.lookupDeclKind)(node.left.name, env) === 'const') {
                context.errors.push(new typeErrors_1.ConstNotAssignableTypeError(node, node.left.name));
            }
            checkForTypeMismatch(node, actualType, expectedType, context);
            return actualType;
        case 'ArrayExpression':
            // Casting is safe here as Source disallows use of spread elements and holes in arrays
            const elements = node.elements.filter((elem) => elem !== null && elem.type !== 'SpreadElement');
            if (elements.length !== node.elements.length) {
                throw new internalTypeErrors_1.TypecheckError(node, 'Disallowed array element type');
            }
            if (elements.length === 0) {
                return (0, utils_1.tArray)(utils_1.tAny);
            }
            const elementTypes = elements.map(elem => typeCheckAndReturnType(elem, context));
            return (0, utils_1.tArray)(mergeTypes(...elementTypes));
        case 'MemberExpression':
            const indexType = typeCheckAndReturnType(node.property, context);
            const objectType = typeCheckAndReturnType(node.object, context);
            // Index must be number
            if (hasTypeMismatchErrors(indexType, utils_1.tNumber)) {
                context.errors.push(new typeErrors_1.InvalidIndexTypeError(node, (0, utils_1.formatTypeString)(indexType, true)));
            }
            // Expression being accessed must be array
            if (objectType.kind !== 'array') {
                context.errors.push(new typeErrors_1.InvalidArrayAccessTypeError(node, (0, utils_1.formatTypeString)(objectType)));
                return utils_1.tAny;
            }
            return objectType.elementType;
        case 'ReturnStatement': {
            if (!node.argument) {
                // Skip typecheck as unspecified literals will be handled by the noImplicitReturnUndefined rule,
                // which is run after typechecking
                return utils_1.tUndef;
            }
            else {
                // Check type only if return type is specified
                const expectedType = lookupTypeAndRemoveForAllAndPredicateTypes(utils_1.RETURN_TYPE_IDENTIFIER);
                if (expectedType) {
                    const argumentType = typeCheckAndReturnType(node.argument, context);
                    checkForTypeMismatch(node, argumentType, expectedType, context);
                    return expectedType;
                }
                else {
                    return typeCheckAndReturnType(node.argument, context);
                }
            }
        }
        case 'WhileStatement': {
            // Predicate must be boolean
            const testType = typeCheckAndReturnType(node.test, context);
            checkForTypeMismatch(node, testType, utils_1.tBool, context);
            return typeCheckAndReturnType(node.body, context);
        }
        case 'ForStatement': {
            // Add new environment so that new variable declared in init node can be isolated to within for statement only
            (0, utils_1.pushEnv)(env);
            if (node.init) {
                typeCheckAndReturnType(node.init, context);
            }
            if (node.test) {
                // Predicate must be boolean
                const testType = typeCheckAndReturnType(node.test, context);
                checkForTypeMismatch(node, testType, utils_1.tBool, context);
            }
            if (node.update) {
                typeCheckAndReturnType(node.update, context);
            }
            const bodyType = typeCheckAndReturnType(node.body, context);
            env.pop();
            return bodyType;
        }
        case 'ImportDeclaration':
            // No typechecking needed, import declarations have already been handled separately
            return utils_1.tUndef;
        case 'TSTypeAliasDeclaration':
            // No typechecking needed, type has already been added to environment
            return utils_1.tUndef;
        case 'TSAsExpression':
            const originalType = typeCheckAndReturnType(node.expression, context);
            const typeToCastTo = getTypeAnnotationType(node, context);
            const formatAsLiteral = typeContainsLiteralType(originalType) || typeContainsLiteralType(typeToCastTo);
            if (hasTypeMismatchErrors(typeToCastTo, originalType)) {
                context.errors.push(new typeErrors_1.TypecastError(node, (0, utils_1.formatTypeString)(originalType, formatAsLiteral), (0, utils_1.formatTypeString)(typeToCastTo, formatAsLiteral)));
            }
            return typeToCastTo;
        case 'TSInterfaceDeclaration':
            throw new internalTypeErrors_1.TypecheckError(node, 'Interface declarations are not allowed');
        default:
            throw new internalTypeErrors_1.TypecheckError(node, 'Unknown node type');
    }
}
/**
 * Adds types for imported functions to the type environment.
 * All imports have their types set to the "any" primitive type.
 */
function handleImportDeclarations(node, context) {
    const importStmts = node.body.filter((stmt) => stmt.type === 'ImportDeclaration');
    if (importStmts.length === 0) {
        return;
    }
    const modules = (0, moduleLoader_1.memoizedGetModuleManifest)();
    const moduleList = Object.keys(modules);
    importStmts.forEach(stmt => {
        // Source only uses strings for import source value
        const moduleName = stmt.source.value;
        if (!moduleList.includes(moduleName)) {
            context.errors.push(new moduleErrors_1.ModuleNotFoundError(moduleName, stmt));
        }
        stmt.specifiers.map(spec => {
            if (spec.type !== 'ImportSpecifier') {
                throw new internalTypeErrors_1.TypecheckError(stmt, 'Unknown specifier type');
            }
            (0, utils_1.setType)(spec.local.name, utils_1.tAny, env);
        });
    });
}
/**
 * Adds all types for variable/function/type declarations to the current environment.
 * This is so that the types can be referenced before the declarations are initialized.
 * Type checking is not carried out as this function is only responsible for hoisting declarations.
 */
function addTypeDeclarationsToEnvironment(node, context) {
    node.body.forEach(node => {
        switch (node.type) {
            case 'FunctionDeclaration':
                if (node.id === null) {
                    throw new Error('Encountered a FunctionDeclaration node without an identifier. This should have been caught when parsing.');
                }
                // Only identifiers/rest elements are used as function params in Source
                const params = node.params.filter((param) => param.type === 'Identifier' || param.type === 'RestElement');
                if (params.length !== node.params.length) {
                    throw new internalTypeErrors_1.TypecheckError(node, 'Unknown function parameter type');
                }
                const fnName = node.id.name;
                const returnType = getTypeAnnotationType(node.returnType, context);
                // If the function has variable number of arguments, set function type as any
                // TODO: Add support for variable number of function arguments
                const hasVarArgs = params.reduce((prev, curr) => prev || curr.type === 'RestElement', false);
                if (hasVarArgs) {
                    (0, utils_1.setType)(fnName, utils_1.tAny, env);
                    break;
                }
                const types = getParamTypes(params, context);
                // Return type will always be last item in types array
                types.push(returnType);
                const fnType = (0, utils_1.tFunc)(...types);
                // Save function type in type env
                (0, utils_1.setType)(fnName, fnType, env);
                break;
            case 'VariableDeclaration':
                if (node.kind === 'var') {
                    throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration using "var" is not allowed');
                }
                if (node.declarations.length !== 1) {
                    throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration should have one and only one declaration');
                }
                if (node.declarations[0].id.type !== 'Identifier') {
                    throw new internalTypeErrors_1.TypecheckError(node, 'Variable declaration ID should be an identifier');
                }
                const id = node.declarations[0].id;
                const expectedType = getTypeAnnotationType(id.typeAnnotation, context);
                // Save variable type and decl kind in type env
                (0, utils_1.setType)(id.name, expectedType, env);
                (0, utils_1.setDeclKind)(id.name, node.kind, env);
                break;
            case 'TSTypeAliasDeclaration':
                const alias = node.id.name;
                if (Object.values(utils_1.typeAnnotationKeywordToBasicTypeMap).includes(alias)) {
                    context.errors.push(new typeErrors_1.TypeAliasNameNotAllowedError(node, alias));
                    break;
                }
                if ((0, utils_1.lookupTypeAlias)(alias, env) !== undefined) {
                    // Only happens when attempting to declare type aliases that share names with predeclared types (e.g. Pair, List)
                    // Declaration of two type aliases with the same name will be caught as syntax error by parser
                    context.errors.push(new typeErrors_1.DuplicateTypeAliasError(node, alias));
                    break;
                }
                let type = utils_1.tAny;
                if (node.typeParameters && node.typeParameters.params.length > 0) {
                    const typeParams = [];
                    // Add type parameters to enclosing environment
                    (0, utils_1.pushEnv)(env);
                    node.typeParameters.params.forEach(param => {
                        if (param.type !== 'TSTypeParameter') {
                            throw new internalTypeErrors_1.TypecheckError(node, 'Invalid type parameter type');
                        }
                        const name = param.name;
                        if (Object.values(utils_1.typeAnnotationKeywordToBasicTypeMap).includes(name)) {
                            context.errors.push(new typeErrors_1.TypeParameterNameNotAllowedError(param, name));
                            return;
                        }
                        const typeVariable = (0, utils_1.tVar)(name);
                        (0, utils_1.setTypeAlias)(name, typeVariable, env);
                        typeParams.push(typeVariable);
                    });
                    // Add own name to enclosing environment for handling recursive types
                    (0, utils_1.setTypeAlias)(alias, (0, utils_1.tVar)(alias, typeParams), env);
                    type = (0, utils_1.tForAll)(getTypeAnnotationType(node, context), typeParams);
                    env.pop();
                }
                else {
                    type = getTypeAnnotationType(node, context);
                }
                (0, utils_1.setTypeAlias)(alias, type, env);
                break;
            default:
                break;
        }
    });
}
/**
 * Typechecks the body of a binary expression, adding any type errors to context if necessary.
 * Then, returns the type of the binary expression, inferred based on the operator.
 */
function typeCheckAndReturnBinaryExpressionType(node, context) {
    const leftType = typeCheckAndReturnType(node.left, context);
    const rightType = typeCheckAndReturnType(node.right, context);
    const leftTypeString = (0, utils_1.formatTypeString)(leftType);
    const rightTypeString = (0, utils_1.formatTypeString)(rightType);
    const operator = node.operator;
    switch (operator) {
        case '-':
        case '*':
        case '/':
        case '%':
            // Return type number
            checkForTypeMismatch(node, leftType, utils_1.tNumber, context);
            checkForTypeMismatch(node, rightType, utils_1.tNumber, context);
            return utils_1.tNumber;
        case '+':
            // Both sides can only be number, string, or any
            // However, the case where one side is string and other side is number is not allowed
            if (leftTypeString === 'number' || leftTypeString === 'string') {
                checkForTypeMismatch(node, rightType, leftType, context);
                // If left type is number or string, return left type
                return leftType;
            }
            if (rightTypeString === 'number' || rightTypeString === 'string') {
                checkForTypeMismatch(node, leftType, rightType, context);
                // If left type is not number or string but right type is number or string, return right type
                return rightType;
            }
            // Return type is number | string if both left and right are neither number nor string
            checkForTypeMismatch(node, leftType, (0, utils_1.tUnion)(utils_1.tNumber, utils_1.tString), context);
            checkForTypeMismatch(node, rightType, (0, utils_1.tUnion)(utils_1.tNumber, utils_1.tString), context);
            return (0, utils_1.tUnion)(utils_1.tNumber, utils_1.tString);
        case '<':
        case '<=':
        case '>':
        case '>=':
        case '!==':
        case '===':
            // In Source 3 and above, skip type checking as equality can be applied between two items of any type
            if (context.chapter > 2 && (operator === '===' || operator === '!==')) {
                return utils_1.tBool;
            }
            // Both sides can only be number, string, or any
            // However, case where one side is string and other side is number is not allowed
            if (leftTypeString === 'number' || leftTypeString === 'string') {
                checkForTypeMismatch(node, rightType, leftType, context);
                return utils_1.tBool;
            }
            if (rightTypeString === 'number' || rightTypeString === 'string') {
                checkForTypeMismatch(node, leftType, rightType, context);
                return utils_1.tBool;
            }
            // Return type boolean
            checkForTypeMismatch(node, leftType, (0, utils_1.tUnion)(utils_1.tNumber, utils_1.tString), context);
            checkForTypeMismatch(node, rightType, (0, utils_1.tUnion)(utils_1.tNumber, utils_1.tString), context);
            return utils_1.tBool;
        default:
            throw new internalTypeErrors_1.TypecheckError(node, 'Unknown operator');
    }
}
/**
 * Typechecks the body of an arrow function, adding any type errors to context if necessary.
 * Then, returns the inferred/declared type of the function.
 */
function typeCheckAndReturnArrowFunctionType(node, context) {
    // Only identifiers/rest elements are used as function params in Source
    const params = node.params.filter((param) => param.type === 'Identifier' || param.type === 'RestElement');
    if (params.length !== node.params.length) {
        throw new internalTypeErrors_1.TypecheckError(node, 'Unknown function parameter type');
    }
    const expectedReturnType = getTypeAnnotationType(node.returnType, context);
    // If the function has variable number of arguments, set function type as any
    // TODO: Add support for variable number of function arguments
    const hasVarArgs = params.reduce((prev, curr) => prev || curr.type === 'RestElement', false);
    if (hasVarArgs) {
        return utils_1.tAny;
    }
    // Type check function body, creating new environment to store arg types and return type
    (0, utils_1.pushEnv)(env);
    params.forEach((param) => {
        (0, utils_1.setType)(param.name, getTypeAnnotationType(param.typeAnnotation, context), env);
    });
    // Set unique identifier so that typechecking can be carried out for return statements
    (0, utils_1.setType)(utils_1.RETURN_TYPE_IDENTIFIER, expectedReturnType, env);
    const actualReturnType = typeCheckAndReturnType(node.body, context);
    env.pop();
    if ((0, lodash_1.isEqual)(actualReturnType, utils_1.tVoid) &&
        !(0, lodash_1.isEqual)(expectedReturnType, utils_1.tAny) &&
        !(0, lodash_1.isEqual)(expectedReturnType, utils_1.tVoid)) {
        // Type error where function does not return anything when it should
        context.errors.push(new typeErrors_1.FunctionShouldHaveReturnValueError(node));
    }
    else {
        checkForTypeMismatch(node, actualReturnType, expectedReturnType, context);
    }
    const types = getParamTypes(params, context);
    // Return type will always be last item in types array
    types.push(node.returnType ? expectedReturnType : actualReturnType);
    return (0, utils_1.tFunc)(...types);
}
/**
 * Recurses through the two given types and returns an array of tuples
 * that map type variable names to the type to substitute.
 */
function getTypeVariableMappings(actualType, expectedType) {
    const mappings = [];
    switch (expectedType.kind) {
        case 'variable':
            mappings.push([expectedType.name, actualType]);
            break;
        case 'pair':
            if (actualType.kind === 'list') {
                if (actualType.typeAsPair !== undefined) {
                    mappings.push(...getTypeVariableMappings(actualType.typeAsPair.headType, expectedType.headType));
                    mappings.push(...getTypeVariableMappings(actualType.typeAsPair.tailType, expectedType.tailType));
                }
                else {
                    mappings.push(...getTypeVariableMappings(actualType.elementType, expectedType.headType));
                    mappings.push(...getTypeVariableMappings(actualType.elementType, expectedType.tailType));
                }
            }
            if (actualType.kind === 'pair') {
                mappings.push(...getTypeVariableMappings(actualType.headType, expectedType.headType));
                mappings.push(...getTypeVariableMappings(actualType.tailType, expectedType.tailType));
            }
            break;
        case 'list':
            if (actualType.kind === 'list') {
                mappings.push(...getTypeVariableMappings(actualType.elementType, expectedType.elementType));
            }
            break;
        case 'function':
            if (actualType.kind === 'function' &&
                actualType.parameterTypes.length === expectedType.parameterTypes.length) {
                for (let i = 0; i < actualType.parameterTypes.length; i++) {
                    mappings.push(...getTypeVariableMappings(actualType.parameterTypes[i], expectedType.parameterTypes[i]));
                }
                mappings.push(...getTypeVariableMappings(actualType.returnType, expectedType.returnType));
            }
            break;
        default:
            break;
    }
    return mappings;
}
/**
 * Checks if the two given types are equal.
 * If not equal, adds type mismatch error to context.
 */
function checkForTypeMismatch(node, actualType, expectedType, context) {
    const formatAsLiteral = typeContainsLiteralType(expectedType) || typeContainsLiteralType(actualType);
    if (hasTypeMismatchErrors(actualType, expectedType)) {
        context.errors.push(new typeErrors_1.TypeMismatchError(node, (0, utils_1.formatTypeString)(actualType, formatAsLiteral), (0, utils_1.formatTypeString)(expectedType, formatAsLiteral)));
    }
}
/**
 * Returns true if given type contains literal type, false otherwise.
 * This is necessary to determine whether the type mismatch errors
 * should be formatted as literal type or primitive type.
 */
function typeContainsLiteralType(type) {
    switch (type.kind) {
        case 'primitive':
        case 'variable':
            return false;
        case 'literal':
            return true;
        case 'function':
            return (typeContainsLiteralType(type.returnType) ||
                type.parameterTypes.reduce((prev, curr) => prev || typeContainsLiteralType(curr), false));
        case 'union':
            return type.types.reduce((prev, curr) => prev || typeContainsLiteralType(curr), false);
        default:
            return false;
    }
}
/**
 * Returns true if the actual type and the expected type do not match, false otherwise.
 * The two types will not match if the intersection of the two types is empty.
 */
function hasTypeMismatchErrors(actualType, expectedType) {
    var _a, _b, _c;
    if ((0, lodash_1.isEqual)(actualType, utils_1.tAny) || (0, lodash_1.isEqual)(expectedType, utils_1.tAny)) {
        // Exit early as "any" is guaranteed not to cause type mismatch errors
        return false;
    }
    if (expectedType.kind !== 'variable' && actualType.kind === 'variable') {
        // If the expected type is not a variable type but the actual type is a variable type,
        // Swap the order of the types around
        // This removes the need to check if the actual type is a variable type in all of the switch cases
        return hasTypeMismatchErrors(expectedType, actualType);
    }
    if (expectedType.kind !== 'union' && actualType.kind === 'union') {
        // If the expected type is not a union type but the actual type is a union type,
        // Check if the expected type matches any of the actual types
        // This removes the need to check if the actual type is a union type in all of the switch cases
        return !containsType(actualType.types, expectedType);
    }
    switch (expectedType.kind) {
        case 'variable':
            if (actualType.kind === 'variable') {
                // If both are variable types, compare without expanding;
                // name and type arguments must match
                if (expectedType.name !== actualType.name) {
                    return true;
                }
                if (expectedType.typeArgs === undefined) {
                    return ((_a = actualType.typeArgs) === null || _a === void 0 ? void 0 : _a.length) !== 0;
                }
                if (((_b = actualType.typeArgs) === null || _b === void 0 ? void 0 : _b.length) !== expectedType.typeArgs.length) {
                    return true;
                }
                for (let i = 0; i < expectedType.typeArgs.length; i++) {
                    if (hasTypeMismatchErrors(actualType.typeArgs[i], expectedType.typeArgs[i])) {
                        return true;
                    }
                }
                return false;
            }
            // Expand variable type and compare expanded type with actual type
            const aliasType = (0, utils_1.lookupTypeAlias)(expectedType.name, env);
            if (aliasType && aliasType.kind === 'forall') {
                // Clone type to prevent modifying generic type saved in type env
                let polyType = (0, lodash_1.cloneDeep)(aliasType.polyType);
                if (expectedType.typeArgs) {
                    if (((_c = aliasType.typeParams) === null || _c === void 0 ? void 0 : _c.length) !== expectedType.typeArgs.length) {
                        return true;
                    }
                    for (let i = 0; i < expectedType.typeArgs.length; i++) {
                        polyType = substituteVariableTypes(polyType, aliasType.typeParams[i], expectedType.typeArgs[i]);
                    }
                }
                return hasTypeMismatchErrors(actualType, polyType);
            }
            return true;
        case 'primitive':
            if (actualType.kind === 'literal') {
                return expectedType.value === undefined
                    ? typeof actualType.value !== expectedType.name
                    : actualType.value !== expectedType.value;
            }
            if (actualType.kind !== 'primitive') {
                return true;
            }
            return actualType.name !== expectedType.name;
        case 'function':
            if (actualType.kind !== 'function') {
                return true;
            }
            // Check parameter types
            const actualParamTypes = actualType.parameterTypes;
            const expectedParamTypes = expectedType.parameterTypes;
            if (actualParamTypes.length !== expectedParamTypes.length) {
                return true;
            }
            for (let i = 0; i < actualType.parameterTypes.length; i++) {
                // Note that actual and expected types are swapped here
                // to simulate contravariance for function parameter types
                // This will be useful if type checking in Source Typed were to be made stricter in the future
                if (hasTypeMismatchErrors(expectedParamTypes[i], actualParamTypes[i])) {
                    return true;
                }
            }
            // Check return type
            return hasTypeMismatchErrors(actualType.returnType, expectedType.returnType);
        case 'union':
            // If actual type is not union type, check if actual type matches one of the expected types
            if (actualType.kind !== 'union') {
                return !containsType(expectedType.types, actualType);
            }
            // If both are union types, there are no type errors as long as one of the types match
            for (const type of actualType.types) {
                if (containsType(expectedType.types, type)) {
                    return false;
                }
            }
            return true;
        case 'literal':
            if (actualType.kind !== 'literal' && actualType.kind !== 'primitive') {
                return true;
            }
            if (actualType.kind === 'primitive' && actualType.value === undefined) {
                return actualType.name !== typeof expectedType.value;
            }
            return actualType.value !== expectedType.value;
        case 'pair':
            if (actualType.kind === 'list') {
                // Special case, as lists are pairs
                if (actualType.typeAsPair !== undefined) {
                    // If pair representation of list is present, check against pair type
                    return hasTypeMismatchErrors(actualType.typeAsPair, expectedType);
                }
                // Head of pair should match list element type; tail of pair should match list type
                return (hasTypeMismatchErrors(actualType.elementType, expectedType.headType) ||
                    hasTypeMismatchErrors(actualType, expectedType.tailType));
            }
            if (actualType.kind !== 'pair') {
                return true;
            }
            return (hasTypeMismatchErrors(actualType.headType, expectedType.headType) ||
                hasTypeMismatchErrors(actualType.tailType, expectedType.tailType));
        case 'list':
            if ((0, lodash_1.isEqual)(actualType, utils_1.tNull)) {
                // Null matches against any list type as null is empty list
                return false;
            }
            if (actualType.kind === 'pair') {
                // Special case, as pairs can be lists
                if (expectedType.typeAsPair !== undefined) {
                    // If pair representation of list is present, check against pair type
                    return hasTypeMismatchErrors(actualType, expectedType.typeAsPair);
                }
                // Head of pair should match list element type; tail of pair should match list type
                return (hasTypeMismatchErrors(actualType.headType, expectedType.elementType) ||
                    hasTypeMismatchErrors(actualType.tailType, expectedType));
            }
            if (actualType.kind !== 'list') {
                return true;
            }
            return hasTypeMismatchErrors(actualType.elementType, expectedType.elementType);
        case 'array':
            if (actualType.kind === 'union') {
                // Special case: number[] | string[] matches with (number | string)[]
                const types = actualType.types.filter((type) => type.kind === 'array');
                if (types.length !== actualType.types.length) {
                    return true;
                }
                const combinedType = types.map(type => type.elementType);
                return hasTypeMismatchErrors((0, utils_1.tUnion)(...combinedType), expectedType.elementType);
            }
            if (actualType.kind !== 'array') {
                return true;
            }
            return hasTypeMismatchErrors(actualType.elementType, expectedType.elementType);
        default:
            return true;
    }
}
/**
 * Converts type annotation/type alias declaration node to its corresponding type representation in Source.
 * If no type annotation exists, returns the "any" primitive type.
 */
function getTypeAnnotationType(annotationNode, context) {
    if (!annotationNode) {
        return utils_1.tAny;
    }
    return getAnnotatedType(annotationNode.typeAnnotation, context);
}
/**
 * Converts type node to its corresponding type representation in Source.
 */
function getAnnotatedType(typeNode, context) {
    switch (typeNode.type) {
        case 'TSFunctionType':
            const params = typeNode.parameters;
            // If the function has variable number of arguments, set function type as any
            // TODO: Add support for variable number of function arguments
            const hasVarArgs = params.reduce((prev, curr) => prev || curr.type === 'RestElement', false);
            if (hasVarArgs) {
                return utils_1.tAny;
            }
            const fnTypes = getParamTypes(params, context);
            // Return type will always be last item in types array
            fnTypes.push(getTypeAnnotationType(typeNode.typeAnnotation, context));
            return (0, utils_1.tFunc)(...fnTypes);
        case 'TSLiteralType':
            const value = typeNode.literal.value;
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
                throw new internalTypeErrors_1.TypecheckError(typeNode, 'Unknown literal type');
            }
            return (0, utils_1.tLiteral)(value);
        case 'TSArrayType':
            return (0, utils_1.tArray)(getAnnotatedType(typeNode.elementType, context));
        case 'TSUnionType':
            const unionTypes = typeNode.types.map(node => getAnnotatedType(node, context));
            return mergeTypes(...unionTypes);
        case 'TSIntersectionType':
            throw new internalTypeErrors_1.TypecheckError(typeNode, 'Intersection types are not allowed');
        case 'TSTypeReference':
            const name = typeNode.typeName.name;
            return lookupTypeAliasAndRemoveForAllAndPredicateTypes(typeNode, name, context);
        case 'TSParenthesizedType':
            return getAnnotatedType(typeNode.typeAnnotation, context);
        default:
            return getBasicType(typeNode, context);
    }
}
/**
 * Converts array of function parameters into array of types.
 */
function getParamTypes(params, context) {
    return params.map(param => getTypeAnnotationType(param.typeAnnotation, context));
}
/**
 * Converts node type to basic type, adding errors to context if disallowed/unknown types are used.
 * If errors are found, returns the "any" type to prevent throwing of further errors.
 */
function getBasicType(node, context) {
    var _a;
    const basicType = (_a = utils_1.typeAnnotationKeywordToBasicTypeMap[node.type]) !== null && _a !== void 0 ? _a : 'unknown';
    if (types_1.disallowedTypes.includes(basicType) ||
        (context.chapter === 1 && basicType === 'null')) {
        context.errors.push(new typeErrors_1.TypeNotAllowedError(node, basicType));
        return utils_1.tAny;
    }
    return (0, utils_1.tPrimitive)(basicType);
}
/**
 * Wrapper function for lookupTypeAlias that removes forall and predicate types.
 * Predicate types are substituted with the function type that takes in 1 argument and returns a boolean.
 * For forall types, the poly type is returned.
 */
function lookupTypeAndRemoveForAllAndPredicateTypes(name) {
    const type = (0, utils_1.lookupType)(name, env);
    if (!type) {
        return undefined;
    }
    if (type.kind === 'forall') {
        if (type.polyType.kind !== 'function') {
            // Skip typecheck as function has variable number of arguments;
            // this only occurs for certain prelude functions
            // TODO: Add support for functions with variable number of arguments
            return utils_1.tAny;
        }
        // Clone type so that original type is not modified
        return (0, lodash_1.cloneDeep)(type.polyType);
    }
    if (type.kind === 'predicate') {
        // All predicate functions (e.g. is_number)
        // take in 1 parameter and return a boolean
        return (0, utils_1.tFunc)(utils_1.tAny, utils_1.tBool);
    }
    return type;
}
/**
 * Wrapper function for lookupTypeAlias that removes forall and predicate types.
 * An error is thrown for predicate types as type aliases should not ever be predicate types.
 * For forall types, the given type arguments are substituted into the poly type,
 * and the resulting type is returned.
 */
function lookupTypeAliasAndRemoveForAllAndPredicateTypes(typeNode, name, context) {
    const type = (0, utils_1.lookupTypeAlias)(name, env);
    if (!type) {
        context.errors.push(new typeErrors_1.TypeNotFoundError(typeNode, name));
        return utils_1.tAny;
    }
    if (type.kind === 'predicate') {
        throw new internalTypeErrors_1.TypecheckError(typeNode, 'Type alias should not be predicate type');
    }
    if (type.kind === 'forall') {
        if (!type.typeParams) {
            throw new internalTypeErrors_1.TypecheckError(typeNode, 'Generic type aliases must have type parameters');
        }
        if (!typeNode.typeParameters ||
            typeNode.typeParameters.params.length !== type.typeParams.length) {
            context.errors.push(new typeErrors_1.InvalidNumberOfTypeArgumentsForGenericTypeError(typeNode, name, type.typeParams.length));
            return utils_1.tAny;
        }
        // Clone type to prevent modifying generic type saved in type env
        let polyType = (0, lodash_1.cloneDeep)(type.polyType);
        const typesToSub = typeNode.typeParameters.params;
        for (let i = 0; i < type.typeParams.length; i++) {
            const typeToSub = typesToSub[i];
            if (typeToSub.type === 'TSTypeParameter') {
                throw new internalTypeErrors_1.TypecheckError(typeNode, 'Type argument should not be type parameter');
            }
            polyType = substituteVariableTypes(polyType, type.typeParams[i], getAnnotatedType(typeToSub, context));
        }
        return polyType;
    }
    if (typeNode.typeParameters !== undefined && type.kind !== 'variable') {
        context.errors.push(new typeErrors_1.TypeNotGenericError(typeNode, name));
        return utils_1.tAny;
    }
    return type;
}
/**
 * Recurses through the given type and returns a new type
 * with all variable types that match the given type variable substituted with the type to substitute.
 */
function substituteVariableTypes(type, typeVar, typeToSub) {
    switch (type.kind) {
        case 'primitive':
        case 'literal':
            return type;
        case 'variable':
            if (type.name === typeVar.name) {
                return typeToSub;
            }
            if (type.typeArgs) {
                for (let i = 0; i < type.typeArgs.length; i++) {
                    if ((0, lodash_1.isEqual)(type.typeArgs[i], typeVar)) {
                        type.typeArgs[i] = typeToSub;
                    }
                }
            }
            return type;
        case 'function':
            const types = type.parameterTypes.map(param => substituteVariableTypes(param, typeVar, typeToSub));
            types.push(substituteVariableTypes(type.returnType, typeVar, typeToSub));
            return (0, utils_1.tFunc)(...types);
        case 'union':
            return (0, utils_1.tUnion)(...type.types.map(type => substituteVariableTypes(type, typeVar, typeToSub)));
        case 'pair':
            return (0, utils_1.tPair)(substituteVariableTypes(type.headType, typeVar, typeToSub), substituteVariableTypes(type.tailType, typeVar, typeToSub));
        case 'list':
            return (0, utils_1.tList)(substituteVariableTypes(type.elementType, typeVar, typeToSub), type.typeAsPair && substituteVariableTypes(type.typeAsPair, typeVar, typeToSub));
        case 'array':
            return (0, utils_1.tArray)(substituteVariableTypes(type.elementType, typeVar, typeToSub));
        default:
            return type;
    }
}
/**
 * Combines all types provided in the parameters into one, removing duplicate types in the process.
 */
function mergeTypes(...types) {
    const mergedTypes = [];
    for (const currType of types) {
        if ((0, lodash_1.isEqual)(currType, utils_1.tAny)) {
            return utils_1.tAny;
        }
        if (currType.kind === 'union') {
            for (const type of currType.types) {
                if (!containsType(mergedTypes, type)) {
                    mergedTypes.push(type);
                }
            }
        }
        else {
            if (!containsType(mergedTypes, currType)) {
                mergedTypes.push(currType);
            }
        }
    }
    if (mergedTypes.length === 1) {
        return mergedTypes[0];
    }
    return (0, utils_1.tUnion)(...mergedTypes);
}
/**
 * Checks if a type exists in an array of types.
 */
function containsType(arr, typeToCheck) {
    for (const type of arr) {
        if (!hasTypeMismatchErrors(typeToCheck, type)) {
            return true;
        }
    }
    return false;
}
/**
 * Traverses through the program and removes all TS-related nodes, returning the result.
 */
function removeTSNodes(node) {
    if (node === undefined || node === null) {
        return node;
    }
    const type = node.type;
    switch (type) {
        case 'Literal':
        case 'Identifier': {
            return node;
        }
        case 'Program':
        case 'BlockStatement': {
            const newBody = [];
            node.body.forEach(stmt => {
                const type = stmt.type;
                if (type.startsWith('TS')) {
                    switch (type) {
                        case 'TSAsExpression':
                            newBody.push(removeTSNodes(stmt));
                            break;
                        default:
                            // Remove node from body
                            break;
                    }
                }
                else {
                    newBody.push(removeTSNodes(stmt));
                }
            });
            node.body = newBody;
            return node;
        }
        case 'ExpressionStatement': {
            node.expression = removeTSNodes(node.expression);
            return node;
        }
        case 'ConditionalExpression':
        case 'IfStatement': {
            node.test = removeTSNodes(node.test);
            node.consequent = removeTSNodes(node.consequent);
            node.alternate = removeTSNodes(node.alternate);
            return node;
        }
        case 'UnaryExpression':
        case 'RestElement':
        case 'SpreadElement':
        case 'ReturnStatement': {
            node.argument = removeTSNodes(node.argument);
            return node;
        }
        case 'BinaryExpression':
        case 'LogicalExpression':
        case 'AssignmentExpression': {
            node.left = removeTSNodes(node.left);
            node.right = removeTSNodes(node.right);
            return node;
        }
        case 'ArrowFunctionExpression':
        case 'FunctionDeclaration':
            node.body = removeTSNodes(node.body);
            return node;
        case 'VariableDeclaration': {
            node.declarations[0].init = removeTSNodes(node.declarations[0].init);
            return node;
        }
        case 'CallExpression': {
            node.arguments = node.arguments.map(removeTSNodes);
            return node;
        }
        case 'ArrayExpression':
            // Casting is safe here as Source disallows use of spread elements and holes in arrays
            node.elements = node.elements.map(removeTSNodes);
            return node;
        case 'MemberExpression':
            node.property = removeTSNodes(node.property);
            node.object = removeTSNodes(node.object);
            return node;
        case 'WhileStatement': {
            node.test = removeTSNodes(node.test);
            node.body = removeTSNodes(node.body);
            return node;
        }
        case 'ForStatement': {
            node.init = removeTSNodes(node.init);
            node.test = removeTSNodes(node.test);
            node.update = removeTSNodes(node.update);
            node.body = removeTSNodes(node.body);
            return node;
        }
        case 'TSAsExpression':
            // Remove wrapper node
            return removeTSNodes(node.expression);
        default:
            // Remove all other TS nodes
            return type.startsWith('TS') ? undefined : node;
    }
}
//# sourceMappingURL=typeErrorChecker.js.map