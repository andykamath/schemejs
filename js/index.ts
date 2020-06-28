import { readFileSync } from 'fs';

let defined = {
    "+": (args: Array<number>) => args.reduce((prev, current) => prev + current),
    "*": (args: Array<number>) => args.reduce((prev, current) => prev * current),
    "-": (args: Array<number>) => args.reduce((prev, current) => prev - current),
    "/": (args: Array<number>) => args.reduce((prev, current) => prev / current),
    "if": (args: Array<number>) => {
        console.log(`IF HAS BEEN CALLED HERE`, args)
        if(evaluate(args[1]) )
        return evaluate(args[2] )
        return evaluate(args[3])
    },
    "=": (args: Array<number>) => args[0] == args[1],
    ">": (args: Array<number>) => args[0] > args[1],
    "define": (args: Array<number>) => {
        console.log("DEFINE CALLED", args)
    }
}

let evaluateFunction = (params) => {
    console.log("evaluateFunction", params)
    if(!(params instanceof Array) || params.length == 1) return params
    const operator = params[0];
    const newParams = params.slice(1).map(evaluateFunction);
    const toReturn = defined[operator](newParams)
    console.log(`evaluateFunction(${JSON.stringify(params)}) returns ${JSON.stringify(toReturn)}`)
    return toReturn
}

/**
 * 
 * @param params The parameters with the operator - (+ x (* y 1))
 * @param args The arguments to the lambda - [x, y]
 * @param terms [20, 10]
 */
let evaluateLambda = (params) => {
    console.log("evaluateLambda", params)
    const operator = params[0];
    const args = operator[1];
    let func = operator[2];
    const terms = params.slice(1);
    args.forEach((x, index) => {
        func = replace(func, x, terms[index])
    });
    console.log(`evaluateLambda(${JSON.stringify(params)}) returns ${JSON.stringify(func)}`)
    return func
}

let evaluateAny = (params) => {
    console.log("evaluateAny", params)
    let operator = params[0];
    if(operator instanceof Array && operator[0] == 'lambda') {
        const newParams = evaluateLambda(params);
        const toReturn = evaluateAny(newParams)
        console.log(`evaluateAny(${JSON.stringify(params)}) returns ${JSON.stringify(toReturn)}`)
        return toReturn
    }
    if(operator == "if") {
        return defined[operator](params)
    }
    const toReturn = evaluateFunction(params)
    console.log(`evaluateAny(${JSON.stringify(params)}) returns ${JSON.stringify(toReturn)}`)
}

/**
 * Evaluates a function
 * @param params The params including the operator
 */
let evaluate = (params) => {
    console.log("evaluate", params)
    let operator = params[0];
    if(operator == "define") {
        const funcName = params[1];
        const operation = params[2];
        defined[funcName] = (terms) => evaluateAny([operation, ...terms])
        console.log(`evaluate(${JSON.stringify(params)}) defines ${funcName} as evaluateAny([${JSON.stringify(operation)}, ...terms]})`)
        return
    }
    console.log("OPERATOR:", operator);
    console.log("PARAMS", params, params.slice(1))
    const toReturn = evaluateAny([operator, ...params.slice(1).map(evaluateAny)]);
    console.log(`evaluate(${JSON.stringify(params)}) returns ${JSON.stringify(toReturn)}`)
    return toReturn
}

/**
 * Replaces a list containing arguments with the values to replace them with
 * @param list the list containing the arguments
 * @param toReplace the argument to replace
 * @param replaceWith the value to replace it with
 */
let replace = (list, toReplace, replaceWith) => {
    console.log("replace", toReplace, "with", replaceWith, "in", list)
    if(!(list instanceof Array)) {
        console.log(`replace(${JSON.stringify(list)}, ${toReplace}, ${replaceWith}) returns ${JSON.stringify(list)}`)
        return list
    }
    const toReturn = list.map(x => (typeof x == 'string' || x instanceof String) ? 
        ((x == toReplace) ? replaceWith : x) : 
        replace(x, toReplace, replaceWith))
    console.log(`replace(${JSON.stringify(list)}, ${toReplace}, ${replaceWith}) returns ${JSON.stringify(toReturn)}`)
    return toReturn
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
console.log(defined)
console.log(defined['andy']([5]))
// console.log(evaluateFunction(evaluatedLambda));