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

