"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var evaluatingLog = function (functionName) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    var paramString = JSON.stringify(params);
    console.log("EVALUATING " + functionName + "(" + paramString.substring(1, paramString.length - 1) + ")");
};
var returnLog = function (functionName, toReturn) {
    var params = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        params[_i - 2] = arguments[_i];
    }
    var paramString = JSON.stringify(params);
    console.log(functionName + "(" + paramString.substring(1, paramString.length - 1) + ") RETURNS " + JSON.stringify(toReturn));
};
var definedOps = {
    "+": function (args) { return args.reduce(function (prev, current) { return evaluate(prev) + evaluate(current); }); },
    "*": function (args) { return args.reduce(function (prev, current) { return evaluate(prev) * evaluate(current); }); },
    "-": function (args) { return args.reduce(function (prev, current) { return evaluate(prev) - evaluate(current); }); },
    "=": function (args) { return args.reduce(function (prev, current) { return evaluate(prev) == evaluate(current); }); },
    ">": function (args) { return args[0] > args[1]; },
    "if": function (args) { return evaluate(args[0]) ? evaluate(args[1]) : evaluate(args[2]); },
};
var defined = function (op, params) {
    evaluatingLog(op, params);
    var toReturn = definedOps[op](params);
    returnLog(op, toReturn, params);
    return toReturn;
};
var evaluateFunction = function (params) {
    evaluatingLog('evaluateFunction', params);
    if (!(params instanceof Array)) {
        returnLog('evaluateFunction', params, params);
        return params;
    }
    var operator = params[0];
    if (operator == 'if')
        console.log("IF FOUND HERE");
    var newParams = params.slice(1); //.map(evaluateFunction);
    var toReturn = defined(operator, newParams);
    returnLog('evaluateFunction', toReturn, params);
    return toReturn;
};
/**
 *
 * @param params The parameters with the operator (+ x (* y 1))
 * @param args The arguments to the lambda [x, y]
 * @param terms [20, 10]
 */
var evaluateLambda = function (params) {
    evaluatingLog('evaluateLambda', params);
    var operator = params[0];
    var args = operator[1];
    var func = operator[2];
    var terms = params.slice(1);
    args.forEach(function (x, index) {
        func = replace(func, x, terms[index]);
    });
    returnLog('evaluateLambda', func, params);
    return func;
};
var evaluateAny = function (params) {
    // evaluatingLog('evaluateAny', params)
    var operator = params[0];
    if (operator instanceof Array && operator[0] == 'lambda')
        params = evaluateLambda(params);
    var toReturn = evaluateFunction(params);
    // returnLog('evaluateAny', toReturn, params)
    return toReturn;
};
var evaluate = function (params) {
    evaluatingLog('evaluate', params);
    // if params isn't an array, return it - it means it is data
    if (!(params instanceof Array)) {
        returnLog('evaluate', params, params);
        return params;
    }
    var operator = params[0];
    if (operator == 'define') {
        var name_1 = params[1];
        var todo_1 = params[2];
        definedOps[name_1] = function (terms) {
            if (terms instanceof Array)
                return evaluate(__spreadArrays([todo_1], terms));
            return evaluate([todo_1, terms]);
        };
        returnLog('evaluate', "new definition for " + name_1 + " as " + JSON.stringify(todo_1), params);
        return;
    }
    var toReturn = evaluateAny(__spreadArrays([operator], params.slice(1).map(evaluate)));
    returnLog('evaluate', toReturn, params);
    return toReturn;
};
var replace = function (list, toReplace, replaceWith) {
    evaluatingLog('replace', list, toReplace, replaceWith);
    if (!(list instanceof Array))
        return list;
    var toReturn = list.map(function (x) { return (typeof x == 'string' || x instanceof String) ?
        ((x == toReplace) ? replaceWith : x) :
        replace(x, toReplace, replaceWith); });
    returnLog('replace', toReturn, list, toReplace, replaceWith);
    return toReturn;
};
/**
 * Reads a racket file as a string
 * @param fileLocation the location of the racket file to read
 * @returns the racket code as a string
 */
var readRacket = function (fileLocation) {
    return fs_1.readFileSync(fileLocation, 'utf8').trim();
};
/**
 * Parses a racket expression
 * @param expression
 */
var readExpression = function (expression) {
    if (!(expression[0] == '(' && expression[expression.length - 1] == ')'))
        return expression;
    // Is the expression a lambda?
    if (expression.substring(0, 7) == '(lambda') {
        expression = expression.substring(8, expression.length - 1);
        var args_1 = [];
        var operation_1 = [];
        var argsFound_1 = false;
        var operationFound_1 = false;
        expression.split('').forEach(function (val, ind) {
            if (val == ')')
                argsFound_1 = true;
            if (val == '(' && argsFound_1)
                operationFound_1 = true;
            if (!argsFound_1 && val != '(' && val != ' ') {
                args_1.push(val);
            }
            else if (operationFound_1)
                operation_1.push(val);
        });
        return ['lambda', args_1, readExpression(operation_1.join(''))];
    }
    expression = expression.substring(1, expression.length - 1);
    var total = [];
    var current = [];
    var openParens = 0;
    var openQuote = false;
    var parenFound = true;
    expression.split('').forEach(function (val, ind) {
        if (val == '(')
            openParens++;
        else if (val == ')')
            openParens--;
        else if (val == '"') {
            openQuote = !openQuote;
        }
        current.push(val);
        if (openParens == 0 && !openQuote && parenFound && val == ' ') {
            if (current.join('').trim() != '')
                total.push(current.join('').trim());
            current = [];
        }
    });
    if (current.join('').trim() != '')
        total.push(current.join(''));
    return total.map(readExpression).map(function (x) { return (isNaN(x) ? x : parseFloat(x)); });
};
var racket = readRacket('../assets/main.rkt');
console.log("TO DECOMPOSE", racket);
var exp = readExpression(racket);
console.log(JSON.stringify(exp));
var evaluatedLambda = evaluate(exp);
console.log(JSON.stringify(evaluatedLambda));
console.log(definedOps);
console.log(defined('andy', 5));
// console.log(evaluate(["andy", ["-", evaluate(2), evaluate(1)]]))
// console.log(evaluateFunction(evaluatedLambda));
