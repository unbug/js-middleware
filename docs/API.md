## Classes

<dl>
<dt><a href="#MiddlewareManager">MiddlewareManager</a></dt>
<dd><p>Manage middlewares for an object.
Middleware functions are functions that have access to the target function and it&#39;s arguments,
and the target object and the next middleware function in the target function cycle.
The next middleware function is commonly denoted by a variable named next.</p>
<p>Middleware functions can perform the following tasks:</p>
<ul>
<li>Execute any code.</li>
<li>Make changes to the function&#39;s arguments.</li>
<li>End the target function.</li>
<li>Call the next middleware in the stack.</li>
</ul>
<p>If the current middleware function does not end the target function cycle,
it must call next() to pass control to the next middleware function. Otherwise,
the target function will be left hanging.</p>
<p>e.g.</p>
<pre><code> const walk = target =&gt; next =&gt; (...args) =&gt; {
    this.log(`walk function start.`);
    const result = next(...args);
    this.log(`walk function end.`);
    return result;
  }
</code></pre><p>Middleware object is an object that contains function&#39;s name as same as the target object&#39;s function name.</p>
<p>e.g.</p>
<pre><code> const Logger = {
     walk: target =&gt; next =&gt; (...args) =&gt; {
       console.log(`walk function start.`);
       const result = next(...args);
       console.log(`walk function end.`);
       return result;
     }
  }
</code></pre><p>Function&#39;s name start or end with &quot;_&quot; will not be able to apply middleware.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#compose">compose(...funcs)</a> ⇒ <code>function</code></dt>
<dd><p>Composes single-argument functions from right to left. The rightmost
function can take multiple arguments as it provides the signature for
the resulting composite function.</p>
</dd>
</dl>

<a name="MiddlewareManager"></a>

## MiddlewareManager
Manage middlewares for an object.
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

e.g.
 ```
 const walk = target => next => (...args) => {
    this.log(`walk function start.`);
    const result = next(...args);
    this.log(`walk function end.`);
    return result;
  }
 ```

Middleware object is an object that contains function's name as same as the target object's function name.

e.g.
 ```
 const Logger = {
     walk: target => next => (...args) => {
       console.log(`walk function start.`);
       const result = next(...args);
       console.log(`walk function end.`);
       return result;
     }
  }
 ```

Function's name start or end with "_" will not be able to apply middleware.

**Kind**: global class  

* [MiddlewareManager](#MiddlewareManager)
    * [new MiddlewareManager(target, ...middlewareObjects)](#new_MiddlewareManager_new)
    * [.use(methodName, ...middlewares)](#MiddlewareManager+use) ⇒ <code>object</code>

<a name="new_MiddlewareManager_new"></a>

### new MiddlewareManager(target, ...middlewareObjects)

| Param | Type | Description |
| --- | --- | --- |
| target | <code>object</code> | The target object. |
| ...middlewareObjects | <code>object</code> | Middleware objects. |

**Example**  
```js
## Basic

We define a Person class.
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

Then we define a middleware function to print log.

// middleware for walk function
const logger = target => next => (...args) => {
  console.log(`walk start, steps: ${args[0]}.`);
  const result = next(...args);
  console.log(`walk end.`);
  return result;
}

Now we apply the log function as a middleware to a Person instance.

// apply middleware to target object
const p = new Person();
const middlewareManager = new MiddlewareManager(p);
middlewareManager.use('walk', walk);
p.walk(3);

Whenever a Person instance call it's walk method, we'll see logs from the looger middleware.

## Middleware object
We can also apply a middleware object to a target object.
Middleware object is an object that contains function's name as same as the target object's function name.

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

## middlewareMethods
Or we can use `middlewareMethods` to define function names for middleware target within a class.

class PersonMiddleware {
  constructor() {
    //Define function names for middleware target.
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
      this.log('this is a middleware trying to say: ' + word);
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
<a name="MiddlewareManager+use"></a>

### middlewareManager.use(methodName, ...middlewares) ⇒ <code>object</code>
Apply (register) middleware functions to the target function or apply (register) middleware objects.
If the first argument is a middleware object, the rest arguments must be middleware objects.

**Kind**: instance method of <code>[MiddlewareManager](#MiddlewareManager)</code>  
**Returns**: <code>object</code> - this  

| Param | Type | Description |
| --- | --- | --- |
| methodName | <code>string</code> &#124; <code>object</code> | String for target function name, object for a middleware object. |
| ...middlewares | <code>function</code> &#124; <code>object</code> | The middleware chain to be applied. |

<a name="compose"></a>

## compose(...funcs) ⇒ <code>function</code>
Composes single-argument functions from right to left. The rightmost
function can take multiple arguments as it provides the signature for
the resulting composite function.

**Kind**: global function  
**Returns**: <code>function</code> - A function obtained by composing the argument functions
from right to left. For example, compose(f, g, h) is identical to doing
(...args) => f(g(h(...args))).  

| Param | Type | Description |
| --- | --- | --- |
| ...funcs | <code>function</code> | The functions to compose. |

