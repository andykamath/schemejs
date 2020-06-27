import { readFileSync } from 'fs';

interface Function {
    name: string
    params: Array<string>
}

let variables = {}

let defined = {
    '+': (...args: number[]) => args.reduce((a, b) => a + b),
    'define': (...params: Array<string>) => {
        // POTENTIAL ERROR: more than 2 parameters passed
        let name: string = params[0]; 
        let procedure: string = params[1];
        // Are there any params associated with the function?
        let nameFunc = readFunction(name)
        let func = readFunction(procedure)
        // if(nameFunc.params.length == 0) {
        //     defined[nameFunc.name] = (...params) => 
        // }
    },
    'struct': (name: string, ...params) => {
        // POTENTIAL LOGIC ERROR: if params and make params don't align in data type and number of args
        defined[`make-${name}`] = (...makeParams) => Object.assign({}, ...params.map((n, index) => ({[n]: makeParams[index]})))
        params.forEach(param => defined[`${name}-${param}`] = (struct) => struct[param])
    }
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
 * Gets the parameters for a function: "(define (x a b c) (+ 5 x))" -> ["define", []]
 * @param func 
 */
let simplifyParams = (func: string): Array<string> => {
    let params = [];
    let current = [];
    let openParens = 0;
    let openQuote = false;
    func.split('').forEach((val, ind) => {
        // Is this a space or a newline?
        if((val == ' ' || val == '\n') && !openQuote && openParens == 0 && ind > 0) {
            params.push(current.join(''));
            current = [];
        }
        else {
            if(val == '"') openQuote = !openQuote
            if(val == '(') openParens++;
            if(val == ')') openParens--;
            current.push(val)
        }
    })
    if(current.length > 0)
        params.push(current.join(''))
    
    // This was commented out to allow for lazy eval
    // let newParams = params.map(readFunction)
    // // if(newParams != params) {
    // //     params = newParams;
    // //     newParams = params.map(readFunction)
    // // }
    return params
}

/**
 * Takes racket and isolates the function name and the parameters
 * @param func the function string
 */
let readFunction = (func: string): Function => {
    if(func[0] != '(')
        return {name: func, params: []}
    let function_name = func.split(' ')[0].replace('(', '')
    let function_params = func.substring(0, func.length - 1).split(' ').slice(1).join(' ')
    let params = simplifyParams(function_params)
    return {name: function_name, params: params}
}

let racket = readRacket('../assets/main.rkt');
let chunks = isolatedChunks(racket);
console.log(JSON.stringify(chunks.map(readFunction), null, 4))
// let test = {'swag': console.log}
// console.log(chunks);
// test['swag']("This works!")
