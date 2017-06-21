# js-middleware

Powerful Javascript Middleware Pattern implementation, apply middleweares to any object.
A painless solution to make codes as scalable and maintainable as ReduxJS and ExpressJS.

## Links
 - [Project overview](https://unbug.github.io/js-middleware/)
 - [Documentation](https://unbug.github.io/js-middleware/docs/html/)
 - [GitHub repo](https://github.com/unbug/js-middleware)

# Overview
Middleware functions are functions that have access to the target function and it's arguments,
and the target object and the next middleware function in the target function cycle.
The next middleware function is commonly denoted by a variable named next.

Middleware functions can perform the following tasks:
  - Execute any code.
  - Make changes to the function's arguments.
  - End the target function.
  - Call the next middleware in the stack.

 If the current middleware function does not end the target function cycle,
 it must call next() to pass control to the next middleware function. Otherwise,
 the target function will be left hanging.
 
# Get started

1. **window.MiddlewareManager** is available for browsers by include
 [`dist/middleware.min.js`](https://github.com/unbug/js-middleware/tree/master/dist) file in your HTML.
```
  <script src="middleware.min.js"></script>
```
2. Or install the package
```
npm install --save js-middleware
```
and import it in your files
```
import {MiddlewareManager} from 'js-middleware';
```

# Usages

## Basic
We define a Person class.
```
// the target object
class Person {
  // the target function
  walk(step) {
    this.step = step;
  }
  
  speak(word) {
    this.word = word;
  }
 }
```
Then we define a middleware function to print log.

```
 // middleware for walk function
 const logger = target => next => (...args) => {
    console.log(`walk start, steps: ${args[0]}.`);
    const result = next(...args);
    console.log(`walk end.`);
    return result;
  }
```
Now we apply the log function as a middleware to a Person instance.

```
 // apply middleware to target object
 const p = new Person();
 const middlewareManager = new MiddlewareManager(p);
 middlewareManager.use('walk', logger);
 p.walk(3);
```
Whenever a Person instance call it's walk method, we'll see logs from the looger middleware.

## Middleware object
We can also apply a middleware object to a target object. Middleware object is an object that contains function's name as same as the target object's function name.
Function's name start or end with "_" will not be able to apply middleware.

```
const PersonMiddleware = {
  walk: target => next => step => {
    console.log(`walk start, steps: step.`);
    const result = next(step);
    console.log(`walk end.`);
    return result;
  },
  speak: target => next => word => {
    word = 'this is a middleware trying to say: ' + word;
    return next(word);
  }
}

 // apply middleware to target object
 const p = new Person();
 const middlewareManager = new MiddlewareManager(p);
 middlewareManager.use(PersonMiddleware);
 p.walk(3);
 p.speak('hi');
```

## middlewareMethods
In a class, function's name start or end with "_" will not be able to apply as middleware.
Or we can use `middlewareMethods` to define function names for middleware target within a class.

```
class PersonMiddleware {
  constructor() {
    /**
     * Or Define function names for middleweare target.
     * @type {Array}
     */
    this.middlewareMethods = ['walk', 'speak'];
  }
  // Function's name start or end with "_" will not be able to apply as middleware.
  _getPrefix() {
   return 'Middleware log: ';
  }
  log(text) {
    console.log('Middleware log: ' + text);
  }
  walk(target) {
    return next => step => {
      this.log(`walk start, steps: step.`);
      const result = next(step);
      this.log(`walk end.`);
      return result;
    }
  }
  speak(target) {
    return next => word => {
      this.log('this is a middleware tring to say: ' + word);
      return next(word);
    }
  }
}

 // apply middleware to target object
 const p = new Person();
 const middlewareManager = new MiddlewareManager(p);
 middlewareManager.use(new PersonMiddleware())
 p.walk(3);
 p.speak('hi');
```

# APIs

### .use(methodName, ...middlewares)
Apply (register) middleware functions to the target function or apply (register) middleware objects.
If the first argument is a middleware object, the rest arguments must be middleware objects.
  - **{string|object}** methodName String for target function name, object for a middleware object.
  - **{...function}** middlewares The middleware chain to be applied.
  - return **{object}** this

# Build
1. Run `npm install` to install requirements.

2. Run `gulp` to builds the library, generates `dist/middleware.js` as the core script, watches for file changes, 
starts a HTTP server for debug.
  ```
  Usage
    gulp [TASK] [OPTIONS...]
  
  Available tasks
    build       Builds the library.
    clean       Cleans files.
    clean:dist  Cleans dist files.
    clean:docs  Cleans docs files.
    default    
    docs        Builds documentation.
    docs:html   Builds HTML documentation.
    docs:md     Builds markdown documentation.
    help        Display this help text.
    lint        Lint JS files.
    mini        Minify the library.
    server      Starts a HTTP server for debug.
    test        Run test cases.
    watch       Watches for changes in files, re-lint, re-build & re-docs.
   ```
3. Run `gulp docs` to build docs. View markdown docs with `docs/API.md`, or run `gulp server` to start a HTTP server 
and view HTML docs with [localhost:3000/docs/html/](localhost:3000/docs/html/).
   
# Roadmap & Make contributions
 - Supports RegExp to match method names, pass the current method name as param to the current middleware.
 - **once(methodName, ...middlewares)** Apply middlewares only run once.
 - Be able to **unuse** middlewares.
