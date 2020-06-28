import { readFileSync } from 'fs';

let defined = {
    "+": (args: Array<number>) => args.reduce((prev, current) => prev + current),
    "*": (args: Array<number>) => args.reduce((prev, current) => prev * current)
}

let evaluateFunction = (params) => {
    if(!(params instanceof Array)) return params
    const operator = params[0];
    params = params.slice(1).map(evaluateFunction);
    return defined[operator](params)
}

/**
 * 
 * @param params The parameters with the operator (+ x (* y 1))
 * @param args The arguments to the lambda [x, y]
 * @param terms [20, 10]
 */
let evaluateLambda = (params) => {
    const operator = params[0];
    const args = operator[1];
    let func = operator[2];
    const terms = params.slice(1);
    args.forEach((x, index) => {
        func = replace(func, x, terms[index])
    });
    return func
}

let evaluateAny = (params) => {
    let operator = params[0];
    if(operator instanceof Array && operator[0] == 'lambda') params = evaluateLambda(params);
    return evaluateFunction(params)
}

let evaluate = (params) => {
    let operator = params[0];
    return evaluateAny([operator, ...params.slice(1).map(evaluateAny)]);
}

let replace = (list, toReplace, replaceWith) => {
    if(!(list instanceof Array)) return list
    return list.map(x => (typeof x == 'string' || x instanceof String) ? 
        ((x == toReplace) ? replaceWith : x) : 
        replace(x, toReplace, replaceWith))
}

/**
 * Reads a racket file as a string
 * @param fileLocation the location of the racket file to read
 * @returns the racket code as a string
 */
let readRacket = (fileLocation: string): string => {
    return readFileSync(fileLocation,'utf8').trim()
}

/**
 * Parses a racket expression
 * @param expression 
 */
let readExpression = (expression: string) => {
    if(!(expression[0] == '(' && expression[expression.length - 1] == ')'))
        return expression;

    // Is the expression a lambda?
    if(expression.substring(0, 7) == '(lambda') {
        expression = expression.substring(8, expression.length - 1)
        let args = [];
        let operation = [];
        let argsFound = false;
        let operationFound = false;
        expression.split('').forEach((val, ind) => {
            if(val == ')') argsFound = true;
            if(val == '(' && argsFound) operationFound = true;
            if(!argsFound && val != '(' && val != ' ') {
                args.push(val)
            }
            else if(operationFound)
                operation.push(val);
        })
        // console.log(eval('(x) => defined["key"]')("b"))
        return ['lambda', args, readExpression(operation.join(''))];
    }
        
    expression = expression.substring(1, expression.length - 1)
    let total = [];
    let current = [];
    let openParens = 0;
    let openQuote = false;
    let parenFound = true;
    expression.split('').forEach((val, ind) => {
        if(val == '(') openParens++;
        else if(val == ')') openParens--;
        else if(val == '"') {
            openQuote = !openQuote;
        }
        current.push(val)

        if(openParens == 0 && !openQuote && parenFound && val == ' ') {
            if(current.join('').trim() != '')
                total.push(current.join('').trim())
            current = []
        }
    });
    if(current.join('').trim() != '') total.push(current.join(''))
    return total.map(readExpression).map((x) => (isNaN(x) ? x : parseFloat(x)))
}

let racket = readRacket('../assets/main.rkt')
console.log("TO DECOMPOSE", racket)
let exp = readExpression(racket);
console.log(JSON.stringify(exp));
let evaluatedLambda = evaluate(exp);
console.log(JSON.stringify(evaluatedLambda))
// console.log(evaluateFunction(evaluatedLambda));