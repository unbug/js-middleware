# js-middleware

Powerful Javascript Middleware Pattern Implementation, manage and apply middleweares for any object.

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

## Install
```
npm install --save js-middleware

```

## import
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
 middlewareManager.use('walk', walk);
 p.walk(3);
```
Whenever a Person instance call it's walk method, we'll see logs from the looger middleware.

## Middleware object
We can also apply a middleware object to a target object. Middleware object is an object that contains function's name as same as the target object's function name.
Function's name start or end with "_" will not be able to apply middleware.

```
const PersonMiddleware {
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
Or we can use `middlewareMethods` to define function names for middleweare target within a class.

```
class CuePointMiddleware {
  constructor() {
    /**
     * Define function names for middleweare target.
     * @type {Array}
     */
    this.middlewareMethods = ['walk', 'speak'];
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
      gulp [TASK]
    
    Available tasks
      default     Run tasks: clean, lint, build, docs, watch, server
      build       Builds the library
      clean       Cleans files
      clean:dist  Cleans dist files
      docs        Builds documentation
      docs:html   Builds HTML documentation
      docs:md     Builds markdown documentation
      help        Display this help text.
      lint        Lint JS files
      server      Starts a HTTP server for debug.
      watch       Watches for changes in files, re-lint, re-build & re-docs
   ```
3. Run `gulp docs` to build docs. View markdown docs with `docs/API.md`, or run `gulp server` to start a HTTP server 
and view HTML docs with [localhost:3000/docs/html/](localhost:3000/docs/html/).
   
