"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var fs_1 = require("fs");
var variables = {};
var defined = {
    '+': function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.reduce(function (a, b) { return a + b; });
    },
    'define': function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        // POTENTIAL ERROR: more than 2 parameters passed
        var name = params[0];
        var procedure = params[1];
        // Are there any params associated with the function?
        var nameFunc = readFunction(name);
        var func = readFunction(procedure);
        // if(nameFunc.params.length == 0) {
        //     defined[nameFunc.name] = (...params) => 
        // }
    },
    'struct': function (name) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        // POTENTIAL LOGIC ERROR: if params and make params don't align in data type and number of args
        defined["make-" + name] = function () {
            var makeParams = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                makeParams[_i] = arguments[_i];
            }
            return Object.assign.apply(Object, __spreadArrays([{}], params.map(function (n, index) {
                var _a;
                return (_a = {}, _a[n] = makeParams[index], _a);
            })));
        };
        params.forEach(function (param) { return defined[name + "-" + param] = function (struct) { return struct[param]; }; });
    }
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
 * Reads racket code and gets all the isolated code chunks
 * @param racket the Racket string
 */
var isolatedChunks = function (racket) {
    var breakOffPoints = [];
    var closed = true;
    var openParens = 0;
    for (var i = 0; i < racket.length; i++) {
        if (closed) {
            breakOffPoints.push(i);
            openParens = 0;
        }
        if (racket[i] == '(') {
            closed = false;
            openParens++;
        }
        if (racket[i] == ')')
            openParens--;
        if (openParens == 0)
            closed = true;
    }
    if (closed) {
        breakOffPoints.push(i);
        openParens = 0;
    }
    var chunks = [];
    for (var i = 0; i < breakOffPoints.length - 1; i++) {
        if (racket[breakOffPoints[i]].trim() != '')
            chunks.push(racket.substring(breakOffPoints[i], breakOffPoints[i + 1]).trim());
    }
    return chunks;
};
/**
 * Gets the parameters for a function: "(define (x a b c) (+ 5 x))" -> ["define", []]
 * @param func
 */
var simplifyParams = function (func) {
    var params = [];
    var current = [];
    var openParens = 0;
    var openQuote = false;
    func.split('').forEach(function (val, ind) {
        // Is this a space or a newline?
        if ((val == ' ' || val == '\n') && !openQuote && openParens == 0 && ind > 0) {
            params.push(current.join(''));
            current = [];
        }
        else {
            if (val == '"')
                openQuote = !openQuote;
            if (val == '(')
                openParens++;
            if (val == ')')
                openParens--;
            current.push(val);
        }
    });
    if (current.length > 0)
        params.push(current.join(''));
    // This was commented out to allow for lazy eval
    // let newParams = params.map(readFunction)
    // // if(newParams != params) {
    // //     params = newParams;
    // //     newParams = params.map(readFunction)
    // // }
    return params;
};
/**
 * Takes racket and isolates the function name and the parameters
 * @param func the function string
 */
var readFunction = function (func) {
    if (func[0] != '(')
        return { name: func, params: [] };
    var function_name = func.split(' ')[0].replace('(', '');
    var function_params = func.substring(0, func.length - 1).split(' ').slice(1).join(' ');
    var params = simplifyParams(function_params);
    return { name: function_name, params: params };
};
var racket = readRacket('../assets/main.rkt');
var chunks = isolatedChunks(racket);
console.log(JSON.stringify(chunks.map(readFunction), null, 4));
// let test = {'swag': console.log}
// console.log(chunks);
// test['swag']("This works!")
