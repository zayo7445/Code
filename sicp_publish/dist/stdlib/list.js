"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawDisplayList = exports.set_tail = exports.set_head = exports.vector_to_list = exports.list_to_vector = exports.is_list = exports.list = exports.is_null = exports.tail = exports.head = exports.is_pair = exports.pair = void 0;
const stringify_1 = require("../utils/stringify");
// array test works differently for Rhino and
// the Firefox environment (especially Web Console)
function array_test(x) {
    if (Array.isArray === undefined) {
        return x instanceof Array;
    }
    else {
        return Array.isArray(x);
    }
}
// pair constructs a pair using a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
function pair(x, xs) {
    return [x, xs];
}
exports.pair = pair;
// is_pair returns true iff arg is a two-element array
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_pair(x) {
    return array_test(x) && x.length === 2;
}
exports.is_pair = is_pair;
// head returns the first component of the given pair,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function head(xs) {
    if (is_pair(xs)) {
        return xs[0];
    }
    else {
        throw new Error('head(xs) expects a pair as argument xs, but encountered ' + (0, stringify_1.stringify)(xs));
    }
}
exports.head = head;
// tail returns the second component of the given pair
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function tail(xs) {
    if (is_pair(xs)) {
        return xs[1];
    }
    else {
        throw new Error('tail(xs) expects a pair as argument xs, but encountered ' + (0, stringify_1.stringify)(xs));
    }
}
exports.tail = tail;
// is_null returns true if arg is exactly null
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_null(xs) {
    return xs === null;
}
exports.is_null = is_null;
// list makes a list out of its arguments
// LOW-LEVEL FUNCTION, NOT SOURCE
function list(...elements) {
    let theList = null;
    for (let i = elements.length - 1; i >= 0; i -= 1) {
        theList = pair(elements[i], theList);
    }
    return theList;
}
exports.list = list;
// recurses down the list and checks that it ends with the empty list null
// LOW-LEVEL FUNCTION, NOT SOURCE
function is_list(xs) {
    while (is_pair(xs)) {
        xs = tail(xs);
    }
    return is_null(xs);
}
exports.is_list = is_list;
// list_to_vector returns vector that contains the elements of the argument list
// in the given order.
// list_to_vector throws an exception if the argument is not a list
// LOW-LEVEL FUNCTION, NOT SOURCE
function list_to_vector(lst) {
    const vector = [];
    while (!is_null(lst)) {
        vector.push(head(lst));
        lst = tail(lst);
    }
    return vector;
}
exports.list_to_vector = list_to_vector;
// vector_to_list returns a list that contains the elements of the argument vector
// in the given order.
// vector_to_list throws an exception if the argument is not a vector
// LOW-LEVEL FUNCTION, NOT SOURCE
function vector_to_list(vector) {
    return list(...vector);
}
exports.vector_to_list = vector_to_list;
// set_head(xs,x) changes the head of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function set_head(xs, x) {
    if (is_pair(xs)) {
        xs[0] = x;
        return undefined;
    }
    else {
        throw new Error('set_head(xs,x) expects a pair as argument xs, but encountered ' + (0, stringify_1.stringify)(xs));
    }
}
exports.set_head = set_head;
// set_tail(xs,x) changes the tail of given pair xs to be x,
// throws an exception if the argument is not a pair
// LOW-LEVEL FUNCTION, NOT SOURCE
function set_tail(xs, x) {
    if (is_pair(xs)) {
        xs[1] = x;
        return undefined;
    }
    else {
        throw new Error('set_tail(xs,x) expects a pair as argument xs, but encountered ' + (0, stringify_1.stringify)(xs));
    }
}
exports.set_tail = set_tail;
function rawDisplayList(display, xs, prepend) {
    const visited = new Set(); // Everything is put into this set, values, arrays, and even objects if they exist
    const asListObjects = new Map(); // maps original list nodes to new list nodes
    // We will convert list-like structures in xs to ListObject.
    class ListObject {
        replArrayContents() {
            const result = [];
            let curXs = this.listNode;
            while (curXs !== null) {
                result.push(head(curXs));
                curXs = tail(curXs);
            }
            return result;
        }
        constructor(listNode) {
            this.replPrefix = 'list(';
            this.replSuffix = ')';
            this.listNode = listNode;
        }
    }
    function getListObject(curXs) {
        return asListObjects.get(curXs) || curXs;
    }
    const pairsToProcess = [];
    let i = 0;
    pairsToProcess.push(xs);
    // we need the guarantee that if there are any proper lists,
    // then the nodes of the proper list appear as a subsequence of this array.
    // We ensure this by always adding the tail after the current node is processed.
    // This means that sometimes, we add the same pair more than once!
    // But because we only process each pair once due to the visited check,
    // and each pair can only contribute to at most 3 items in this array,
    // this array has O(n) elements.
    while (i < pairsToProcess.length) {
        const curXs = pairsToProcess[i];
        i++;
        if (visited.has(curXs)) {
            continue;
        }
        visited.add(curXs);
        if (!is_pair(curXs)) {
            continue;
        }
        pairsToProcess.push(head(curXs), tail(curXs));
    }
    // go through pairs in reverse to ensure the dependencies are resolved first
    while (pairsToProcess.length > 0) {
        const curXs = pairsToProcess.pop();
        if (!is_pair(curXs)) {
            continue;
        }
        const h = head(curXs);
        const t = tail(curXs);
        const newTail = getListObject(t); // the reason why we need the above guarantee
        const newXs = is_null(newTail) || newTail instanceof ListObject
            ? new ListObject(pair(h, t)) // tail is a proper list
            : pair(h, t); // it's not a proper list, make a copy of the pair so we can change references below
        asListObjects.set(curXs, newXs);
    }
    for (const curXs of asListObjects.values()) {
        if (is_pair(curXs)) {
            set_head(curXs, getListObject(head(curXs)));
            set_tail(curXs, getListObject(tail(curXs)));
        }
        else if (curXs instanceof ListObject) {
            set_head(curXs.listNode, getListObject(head(curXs.listNode)));
            let newTail = getListObject(tail(curXs.listNode));
            if (newTail instanceof ListObject) {
                newTail = newTail.listNode;
            }
            set_tail(curXs.listNode, newTail);
        }
    }
    display(getListObject(xs), prepend);
    return xs;
}
exports.rawDisplayList = rawDisplayList;
//# sourceMappingURL=list.js.map