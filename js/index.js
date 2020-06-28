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
var defined = {
    "+": function (args) { return args.reduce(function (prev, current) { return prev + current; }); },
    "*": function (args) { return args.reduce(function (prev, current) { return prev * current; }); }
};
var evaluateFunction = function (params) {
    if (!(params instanceof Array))
        return params;
    var operator = params[0];
    params = params.slice(1).map(evaluateFunction);
    return defined[operator](params);
};
/**
 *
 * @param params The parameters with the operator (+ x (* y 1))
 * @param args The arguments to the lambda [x, y]
 * @param terms [20, 10]
 */
var evaluateLambda = function (params) {
    var operator = params[0];
    var args = operator[1];
    var func = operator[2];
    var terms = params.slice(1);
    args.forEach(function (x, index) {
        func = replace(func, x, terms[index]);
    });
    return func;
};
var evaluateAny = function (params) {
    var operator = params[0];
    if (operator instanceof Array && operator[0] == 'lambda')
        params = evaluateLambda(params);
    return evaluateFunction(params);
};
var evaluate = function (params) {
    var operator = params[0];
    return evaluateAny(__spreadArrays([operator], params.slice(1).map(evaluateAny)));
};
var replace = function (list, toReplace, replaceWith) {
    if (!(list instanceof Array))
        return list;
    return list.map(function (x) { return (typeof x == 'string' || x instanceof String) ?
        ((x == toReplace) ? replaceWith : x) :
        replace(x, toReplace, replaceWith); });
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
        // console.log(eval('(x) => defined["key"]')("b"))
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
// console.log(evaluateFunction(evaluatedLambda));
