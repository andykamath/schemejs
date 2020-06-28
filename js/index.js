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
    "*": function (args) { return args.reduce(function (prev, current) { return prev * current; }); },
    "-": function (args) { return args.reduce(function (prev, current) { return prev - current; }); },
    "/": function (args) { return args.reduce(function (prev, current) { return prev / current; }); },
    "if": function (args) {
        console.log("IF HAS BEEN CALLED HERE", args);
        if (evaluate(args[1]))
            return evaluate(args[2]);
        return evaluate(args[3]);
    },
    "=": function (args) { return args[0] == args[1]; },
    ">": function (args) { return args[0] > args[1]; },
    "define": function (args) {
        console.log("DEFINE CALLED", args);
    }
};
var evaluateFunction = function (params) {
    console.log("evaluateFunction", params);
    if (!(params instanceof Array) || params.length == 1)
        return params;
    var operator = params[0];
    var newParams = params.slice(1).map(evaluateFunction);
    var toReturn = defined[operator](newParams);
    console.log("evaluateFunction(" + JSON.stringify(params) + ") returns " + JSON.stringify(toReturn));
    return toReturn;
};
/**
 *
 * @param params The parameters with the operator - (+ x (* y 1))
 * @param args The arguments to the lambda - [x, y]
 * @param terms [20, 10]
 */
var evaluateLambda = function (params) {
    console.log("evaluateLambda", params);
    var operator = params[0];
    var args = operator[1];
    var func = operator[2];
    var terms = params.slice(1);
    args.forEach(function (x, index) {
        func = replace(func, x, terms[index]);
    });
    console.log("evaluateLambda(" + JSON.stringify(params) + ") returns " + JSON.stringify(func));
    return func;
};
var evaluateAny = function (params) {
    console.log("evaluateAny", params);
    var operator = params[0];
    if (operator instanceof Array && operator[0] == 'lambda') {
        var newParams = evaluateLambda(params);
        var toReturn_1 = evaluateAny(newParams);
        console.log("evaluateAny(" + JSON.stringify(params) + ") returns " + JSON.stringify(toReturn_1));
        return toReturn_1;
    }
    if (operator == "if") {
        return defined[operator](params);
    }
    var toReturn = evaluateFunction(params);
    console.log("evaluateAny(" + JSON.stringify(params) + ") returns " + JSON.stringify(toReturn));
};
/**
 * Evaluates a function
 * @param params The params including the operator
 */
var evaluate = function (params) {
    console.log("evaluate", params);
    var operator = params[0];
    if (operator == "define") {
        var funcName = params[1];
        var operation_1 = params[2];
        defined[funcName] = function (terms) { return evaluateAny(__spreadArrays([operation_1], terms)); };
        console.log("evaluate(" + JSON.stringify(params) + ") defines " + funcName + " as evaluateAny([" + JSON.stringify(operation_1) + ", ...terms]})");
        return;
    }
    console.log("OPERATOR:", operator);
    console.log("PARAMS", params, params.slice(1));
    var toReturn = evaluateAny(__spreadArrays([operator], params.slice(1).map(evaluateAny)));
    console.log("evaluate(" + JSON.stringify(params) + ") returns " + JSON.stringify(toReturn));
    return toReturn;
};
/**
 * Replaces a list containing arguments with the values to replace them with
 * @param list the list containing the arguments
 * @param toReplace the argument to replace
 * @param replaceWith the value to replace it with
 */
var replace = function (list, toReplace, replaceWith) {
    console.log("replace", toReplace, "with", replaceWith, "in", list);
    if (!(list instanceof Array)) {
        console.log("replace(" + JSON.stringify(list) + ", " + toReplace + ", " + replaceWith + ") returns " + JSON.stringify(list));
        return list;
    }
    var toReturn = list.map(function (x) { return (typeof x == 'string' || x instanceof String) ?
        ((x == toReplace) ? replaceWith : x) :
        replace(x, toReplace, replaceWith); });
    console.log("replace(" + JSON.stringify(list) + ", " + toReplace + ", " + replaceWith + ") returns " + JSON.stringify(toReturn));
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
        var operation_2 = [];
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
                operation_2.push(val);
        });
        return ['lambda', args_1, readExpression(operation_2.join(''))];
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
console.log(defined);
console.log(defined['andy']([5]));
// console.log(evaluateFunction(evaluatedLambda));
