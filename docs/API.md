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
  }</code></pre><p>Middleware object is an object that contains function&#39;s name as same as the target object&#39;s function name.</p>
<p>e.g.</p>
<pre><code> const Logger = {
     walk: target =&gt; next =&gt; (...args) =&gt; {
       console.log(`walk function start.`);
       const result = next(...args);
       console.log(`walk function end.`);
       return result;
     }
  }</code></pre><p>Function&#39;s name start or end with &quot;_&quot; will not be able to apply middleware.</p>
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
    * [.MiddlewareManager](#MiddlewareManager+MiddlewareManager)
        * [new exports.MiddlewareManager(target, ...middlewareObjects)](#new_MiddlewareManager+MiddlewareManager_new)
    * [.use(methodName, ...middlewares)](#MiddlewareManager+use) ⇒ <code>object</code>

<a name="MiddlewareManager+MiddlewareManager"></a>

### middlewareManager.MiddlewareManager
**Kind**: instance class of [<code>MiddlewareManager</code>](#MiddlewareManager)  
<a name="new_MiddlewareManager+MiddlewareManager_new"></a>

#### new exports.MiddlewareManager(target, ...middlewareObjects)
**Returns**: <code>object</code> - this  

| Param | Type | Description |
| --- | --- | --- |
| target | <code>object</code> | The target object. |
| ...middlewareObjects | <code>object</code> | Middleware objects. |

<a name="MiddlewareManager+use"></a>

### middlewareManager.use(methodName, ...middlewares) ⇒ <code>object</code>
Apply (register) middleware functions to the target function or apply (register) middleware objects.
If the first argument is a middleware object, the rest arguments must be middleware objects.

**Kind**: instance method of [<code>MiddlewareManager</code>](#MiddlewareManager)  
**Returns**: <code>object</code> - this  

| Param | Type | Description |
| --- | --- | --- |
| methodName | <code>string</code> \| <code>object</code> | String for target function name, object for a middleware object. |
| ...middlewares | <code>function</code> \| <code>object</code> | The middleware chain to be applied. |

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

