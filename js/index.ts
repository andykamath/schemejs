import { readFileSync } from 'fs';

let evaluatingLog = (functionName, ...params) => {
    const paramString = JSON.stringify(params)
    console.log(`EVALUATING ${functionName}(${paramString.substring(1, paramString.length - 1)})`)
}

let returnLog = (functionName, toReturn, ...params) => {
    const paramString = JSON.stringify(params)
    console.log(`${functionName}(${paramString.substring(1, paramString.length - 1)}) RETURNS ${JSON.stringify(toReturn)}`)
}

let definedOps = {
    "+": (args: Array<number>) => args.reduce((prev, current) => evaluate(prev) + evaluate(current)),
    "*": (args: Array<number>) => args.reduce((prev, current) => evaluate(prev) * evaluate(current)),
    "-": (args) => args.reduce((prev, current) => evaluate(prev) - evaluate(current)),
    "=": (args) => args.reduce((prev, current) => evaluate(prev) == evaluate(current)),
    ">": (args) => args[0] > args[1],
    "if": (args) => evaluate(args[0]) ? evaluate(args[1]) : evaluate(args[2]),
    "zero?": (args) => evaluate(args) == 0,
    "cons": (args) => ["cons", args[0], args[1]],
}

let defined = (op, params) => {
    evaluatingLog(op, params)
    // if(op instanceof Array && op[0] == 'lambda') {
    //     console.log("LAMBDA PARAMS", params)
    //     returnLog(op, "NEW FUNCTION", params)
    //     return (terms) => {
    //         if(terms instanceof Array) return evaluate([op, ...terms])
    //         return evaluate([op, terms])
    //     }
    // }
    console.log("USING OP", op, definedOps, definedOps[op])
    const toReturn = definedOps[op](params)
    returnLog(op, toReturn, params)
    return toReturn
}

let evaluateFunction = (params) => {
    evaluatingLog('evaluateFunction', params)
    if(!(params instanceof Array)) {
        returnLog('evaluateFunction', params, params)
        return params
    }
    const operator = params[0];
    if(operator == 'if') console.log("IF FOUND HERE")
    const newParams = params.slice(1);
    const toReturn = defined(operator, newParams)
    returnLog('evaluateFunction', toReturn, params)
    return toReturn
}

/**
 * 
 * @param params The parameters with the operator (+ x (* y 1))
 * @param args The arguments to the lambda [x, y]
 * @param terms [20, 10]
 */
let evaluateLambda = (params) => {
    evaluatingLog('evaluateLambda', params)
    const operator = params[0];
    const args = operator[1];
    let func = operator[2];
    const terms = params.slice(1);
    args.forEach((x, index) => {
        func = replace(func, x, terms[index])
    });
    returnLog('evaluateLambda', func, params)
    return func
}

let evaluateAny = (params) => {
    // evaluatingLog('evaluateAny', params)
    let operator = params[0];
    if(operator instanceof Array && operator[0] == 'lambda') params = evaluateLambda(params);
    else if(operator instanceof Array) operator = evaluate(operator)
    const toReturn = evaluateFunction(params)
    // returnLog('evaluateAny', toReturn, params)
    return toReturn
}

let evaluate = (params) => {
    evaluatingLog('evaluate', params)
    // if params isn't an array, return it - it means it is data
    if(!(params instanceof Array)) {
        returnLog('evaluate', params, params)
        return params
    }
    let operator = params[0];
    if(operator == 'define') {
        const name = params[1];
        const todo = params[2];
        definedOps[name] = (terms) => {
            if(terms instanceof Array) return evaluate([todo, ...terms])
            return evaluate([todo, terms])
        }
        returnLog('evaluate', `new definition for ${name} as ${JSON.stringify(todo)}`, params)
        return
    }
    if(operator == 'lambda') {
        return params
    }
    const toReturn = evaluateAny([operator, ...params.slice(1).map(evaluate)]);
    returnLog('evaluate', toReturn, params)
    return toReturn
}

let replace = (list, toReplace, replaceWith) => {
    evaluatingLog('replace', list, toReplace, replaceWith)
    if(!(list instanceof Array)) return list
    const toReturn = list.map(x => (typeof x == 'string' || x instanceof String) ? 
        ((x == toReplace) ? replaceWith : x) : 
        replace(x, toReplace, replaceWith))
    returnLog('replace', toReturn, list, toReplace, replaceWith)
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
 * Reads racket code and gets all the isolated code chunks
 * @param racket the Racket string
 */
let isolatedChunks = (racket: string): Array<string> => {
    let breakOffPoints = []
    let closed = true
    let openParens = 0;
    for(var i = 0; i < racket.length; i++) {
        if(closed) {
            breakOffPoints.push(i);
            openParens = 0;
        }

        if(racket[i] == '(') {
            closed = false;
            openParens++;
        }
        if(racket[i] == ')') openParens--;
        if(openParens == 0) closed = true;
    }
    if(closed) {
        breakOffPoints.push(i);
        openParens = 0;
    }

    let chunks = []
    for(var i = 0; i < breakOffPoints.length - 1; i++) {
        if(racket[breakOffPoints[i]].trim() != '') 
            chunks.push(racket.substring(breakOffPoints[i], breakOffPoints[i+1]).trim());
    }
    return chunks
}

/**
 * Parses a racket expression
 * @param expression 
 */
let readExpression = (expression: string) => {
    if(!(expression[0] == '(' && expression[expression.length - 1] == ')'))
        return expression

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
        return ['lambda', args.join('').split(' '), readExpression(operation.join(''))];
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
let chunks = isolatedChunks(racket)
console.log("CHUNKS", chunks)
chunks.map(x => evaluate(readExpression(x)))
// let exp = readExpression(racket);
// console.log(JSON.stringify(exp));
// let evaluatedLambda = evaluate(exp);
// console.log(JSON.stringify(evaluatedLambda))
// console.log(definedOps)
// console.log(defined('andy', 5))