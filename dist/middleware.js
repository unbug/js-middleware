(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.compose = compose;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var middlewareManagerHash = [];

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  funcs = funcs.filter(function (func) {
    return typeof func === 'function';
  });

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}

/**
 * Manage middlewares for an object.
 * Middleware functions are functions that have access to the target function and it's arguments,
 * and the target object and the next middleware function in the target function cycle.
 * The next middleware function is commonly denoted by a variable named next.
 *
 * Middleware functions can perform the following tasks:
 *  - Execute any code.
 *  - Make changes to the function's arguments.
 *  - End the target function.
 *  - Call the next middleware in the stack.
 *
 * If the current middleware function does not end the target function cycle,
 * it must call next() to pass control to the next middleware function. Otherwise,
 * the target function will be left hanging.
 *
 * e.g.
 *  ```
 *  const walk = target => next => (...args) => {
 *     this.log(`walk function start.`);
 *     const result = next(...args);
 *     this.log(`walk function end.`);
 *     return result;
 *   }
 *  ```
 *
 * Middleware object is an object that contains function's name as same as the target object's function name.
 *
 * e.g.
 *  ```
 *  const Logger = {
 *      walk: target => next => (...args) => {
 *        console.log(`walk function start.`);
 *        const result = next(...args);
 *        console.log(`walk function end.`);
 *        return result;
 *      }
 *   }
 *  ```
 *
 * Function's name start or end with "_" will not be able to apply middleware.
 *
 * @example
 *
 * ## Basic
 *
 * We define a Person class.
 * // the target object
 * class Person {
 *   // the target function
 *   walk(step) {
 *     this.step = step;
 *   }
 *
 *   speak(word) {
 *     this.word = word;
 *   }
 * }
 *
 * Then we define a middleware function to print log.
 *
 * // middleware for walk function
 * const logger = target => next => (...args) => {
 *   console.log(`walk start, steps: ${args[0]}.`);
 *   const result = next(...args);
 *   console.log(`walk end.`);
 *   return result;
 * }
 *
 * Now we apply the log function as a middleware to a Person instance.
 *
 * // apply middleware to target object
 * const p = new Person();
 * const middlewareManager = new MiddlewareManager(p);
 * middlewareManager.use('walk', walk);
 * p.walk(3);
 *
 * Whenever a Person instance call it's walk method, we'll see logs from the looger middleware.
 *
 * ## Middleware object
 * We can also apply a middleware object to a target object.
 * Middleware object is an object that contains function's name as same as the target object's function name.
 *
 * const PersonMiddleware {
 *   walk: target => next => step => {
 *     console.log(`walk start, steps: step.`);
 *     const result = next(step);
 *     console.log(`walk end.`);
 *     return result;
 *   },
 *   speak: target => next => word => {
 *     word = 'this is a middleware trying to say: ' + word;
 *     return next(word);
 *   }
 * }
 *
 * // apply middleware to target object
 * const p = new Person();
 * const middlewareManager = new MiddlewareManager(p);
 * middlewareManager.use(PersonMiddleware);
 * p.walk(3);
 * p.speak('hi');
 *
 * ## middlewareMethods
 * Or we can use `middlewareMethods` to define function names for middleware target within a class.
 *
 * class PersonMiddleware {
 *   constructor() {
 *     //Define function names for middleware target.
 *     this.middlewareMethods = ['walk', 'speak'];
 *   }
 *   log(text) {
 *     console.log('Middleware log: ' + text);
 *   }
 *   walk(target) {
 *     return next => step => {
 *       this.log(`walk start, steps: step.`);
 *       const result = next(step);
 *       this.log(`walk end.`);
 *       return result;
 *     }
 *   }
 *   speak(target) {
 *     return next => word => {
 *       this.log('this is a middleware trying to say: ' + word);
 *       return next(word);
 *     }
 *   }
 * }
 *
 * // apply middleware to target object
 * const p = new Person();
 * const middlewareManager = new MiddlewareManager(p);
 * middlewareManager.use(new PersonMiddleware())
 * p.walk(3);
 * p.speak('hi');
 *
 */

var MiddlewareManager = exports.MiddlewareManager = function () {
  /**
   * @param {object} target The target object.
   * @param {...object} middlewareObjects Middleware objects.
   * @return {object} this
   */
  function MiddlewareManager(target) {
    var _instance;

    _classCallCheck(this, MiddlewareManager);

    var instance = middlewareManagerHash.find(function (key) {
      return key._target === target;
    });
    // a target can only has one MiddlewareManager instance
    if (instance === undefined) {
      this._target = target;
      this._methods = {};
      this._methodMiddlewares = {};
      middlewareManagerHash.push(this);
      instance = this;
    }

    for (var _len2 = arguments.length, middlewareObjects = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      middlewareObjects[_key2 - 1] = arguments[_key2];
    }

    (_instance = instance).use.apply(_instance, middlewareObjects);

    return instance;
  }

  _createClass(MiddlewareManager, [{
    key: '_applyToMethod',
    value: function _applyToMethod(methodName) {
      var _this = this;

      if (typeof methodName === 'string' && !/^_+|_+$/g.test(methodName)) {
        var method = this._methods[methodName] || this._target[methodName];
        if (typeof method === 'function') {
          this._methods[methodName] = method;
          if (this._methodMiddlewares[methodName] === undefined) {
            this._methodMiddlewares[methodName] = [];
          }

          for (var _len3 = arguments.length, middlewares = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            middlewares[_key3 - 1] = arguments[_key3];
          }

          middlewares.forEach(function (middleware) {
            return typeof middleware === 'function' && _this._methodMiddlewares[methodName].push(middleware(_this._target));
          });
          this._target[methodName] = compose.apply(undefined, _toConsumableArray(this._methodMiddlewares[methodName]))(method.bind(this._target));
        }
      }
    }

    /**
     * Apply (register) middleware functions to the target function or apply (register) middleware objects.
     * If the first argument is a middleware object, the rest arguments must be middleware objects.
     *
     * @param {string|object} methodName String for target function name, object for a middleware object.
     * @param {...function|...object} middlewares The middleware chain to be applied.
     * @return {object} this
     */

  }, {
    key: 'use',
    value: function use(methodName) {
      var _this2 = this;

      for (var _len4 = arguments.length, middlewares = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        middlewares[_key4 - 1] = arguments[_key4];
      }

      if ((typeof methodName === 'undefined' ? 'undefined' : _typeof(methodName)) === 'object') {
        Array.prototype.slice.call(arguments).forEach(function (arg) {
          // A middleware object can specify target functions within middlewareMethods (Array).
          // e.g. obj.middlewareMethods = ['method1', 'method2'];
          // only method1 and method2 will be the target function.
          (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && (arg.middlewareMethods || Object.keys(arg)).forEach(function (key) {
            typeof arg[key] === 'function' && _this2._applyToMethod(key, arg[key].bind(arg));
          });
        });
      } else {
        this._applyToMethod.apply(this, [methodName].concat(middlewares));
      }

      return this;
    }
  }]);

  return MiddlewareManager;
}();

if (window) {
  window['MiddlewareManager'] = MiddlewareManager;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTWlkZGxld2FyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7O1FBY2dCLE8sR0FBQSxPOzs7Ozs7QUFaaEIsSUFBSSx3QkFBd0IsRUFBNUI7O0FBRUE7Ozs7Ozs7Ozs7QUFVTyxTQUFTLE9BQVQsR0FBMkI7QUFBQSxvQ0FBUCxLQUFPO0FBQVAsU0FBTztBQUFBOztBQUNoQyxNQUFJLE1BQU0sTUFBTixLQUFpQixDQUFyQixFQUF3QjtBQUN0QixXQUFPO0FBQUEsYUFBTyxHQUFQO0FBQUEsS0FBUDtBQUNEOztBQUVELFVBQVEsTUFBTSxNQUFOLENBQWE7QUFBQSxXQUFRLE9BQU8sSUFBUCxLQUFnQixVQUF4QjtBQUFBLEdBQWIsQ0FBUjs7QUFFQSxNQUFJLE1BQU0sTUFBTixLQUFpQixDQUFyQixFQUF3QjtBQUN0QixXQUFPLE1BQU0sQ0FBTixDQUFQO0FBQ0Q7O0FBRUQsTUFBTSxPQUFPLE1BQU0sTUFBTSxNQUFOLEdBQWUsQ0FBckIsQ0FBYjtBQUNBLE1BQU0sT0FBTyxNQUFNLEtBQU4sQ0FBWSxDQUFaLEVBQWUsQ0FBQyxDQUFoQixDQUFiO0FBQ0EsU0FBTztBQUFBLFdBQWEsS0FBSyxXQUFMLENBQWlCLFVBQUMsUUFBRCxFQUFXLENBQVg7QUFBQSxhQUFpQixFQUFFLFFBQUYsQ0FBakI7QUFBQSxLQUFqQixFQUErQyxnQ0FBL0MsQ0FBYjtBQUFBLEdBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQTBJYSxpQixXQUFBLGlCO0FBQ1g7Ozs7O0FBS0EsNkJBQVksTUFBWixFQUEwQztBQUFBOztBQUFBOztBQUN4QyxRQUFJLFdBQVcsc0JBQXNCLElBQXRCLENBQTJCLFVBQVUsR0FBVixFQUFlO0FBQ3ZELGFBQU8sSUFBSSxPQUFKLEtBQWdCLE1BQXZCO0FBQ0QsS0FGYyxDQUFmO0FBR0E7QUFDQSxRQUFJLGFBQWEsU0FBakIsRUFBNEI7QUFDMUIsV0FBSyxPQUFMLEdBQWUsTUFBZjtBQUNBLFdBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBLFdBQUssa0JBQUwsR0FBMEIsRUFBMUI7QUFDQSw0QkFBc0IsSUFBdEIsQ0FBMkIsSUFBM0I7QUFDQSxpQkFBVyxJQUFYO0FBQ0Q7O0FBWHVDLHVDQUFuQixpQkFBbUI7QUFBbkIsdUJBQW1CO0FBQUE7O0FBWXhDLDJCQUFTLEdBQVQsa0JBQWdCLGlCQUFoQjs7QUFFQSxXQUFPLFFBQVA7QUFDRDs7OzttQ0FFYyxVLEVBQTRCO0FBQUE7O0FBQ3pDLFVBQUksT0FBTyxVQUFQLEtBQXNCLFFBQXRCLElBQWtDLENBQUMsV0FBVyxJQUFYLENBQWdCLFVBQWhCLENBQXZDLEVBQW9FO0FBQ2xFLFlBQUksU0FBUyxLQUFLLFFBQUwsQ0FBYyxVQUFkLEtBQTZCLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBMUM7QUFDQSxZQUFJLE9BQU8sTUFBUCxLQUFrQixVQUF0QixFQUFrQztBQUNoQyxlQUFLLFFBQUwsQ0FBYyxVQUFkLElBQTRCLE1BQTVCO0FBQ0EsY0FBSSxLQUFLLGtCQUFMLENBQXdCLFVBQXhCLE1BQXdDLFNBQTVDLEVBQXVEO0FBQ3JELGlCQUFLLGtCQUFMLENBQXdCLFVBQXhCLElBQXNDLEVBQXRDO0FBQ0Q7O0FBSitCLDZDQUhSLFdBR1E7QUFIUix1QkFHUTtBQUFBOztBQUtoQyxzQkFBWSxPQUFaLENBQW9CO0FBQUEsbUJBQ2xCLE9BQU8sVUFBUCxLQUFzQixVQUF0QixJQUFvQyxNQUFLLGtCQUFMLENBQXdCLFVBQXhCLEVBQW9DLElBQXBDLENBQXlDLFdBQVcsTUFBSyxPQUFoQixDQUF6QyxDQURsQjtBQUFBLFdBQXBCO0FBR0EsZUFBSyxPQUFMLENBQWEsVUFBYixJQUEyQiw0Q0FBVyxLQUFLLGtCQUFMLENBQXdCLFVBQXhCLENBQVgsR0FBZ0QsT0FBTyxJQUFQLENBQVksS0FBSyxPQUFqQixDQUFoRCxDQUEzQjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDs7Ozs7Ozs7Ozs7d0JBUUksVSxFQUE0QjtBQUFBOztBQUFBLHlDQUFiLFdBQWE7QUFBYixtQkFBYTtBQUFBOztBQUM5QixVQUFJLFFBQU8sVUFBUCx5Q0FBTyxVQUFQLE9BQXNCLFFBQTFCLEVBQW9DO0FBQ2xDLGNBQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixJQUF0QixDQUEyQixTQUEzQixFQUFzQyxPQUF0QyxDQUE4QyxlQUFPO0FBQ25EO0FBQ0E7QUFDQTtBQUNBLGtCQUFPLEdBQVAseUNBQU8sR0FBUCxPQUFlLFFBQWYsSUFBMkIsQ0FBQyxJQUFJLGlCQUFKLElBQXlCLE9BQU8sSUFBUCxDQUFZLEdBQVosQ0FBMUIsRUFBNEMsT0FBNUMsQ0FBb0QsZUFBTztBQUNwRixtQkFBTyxJQUFJLEdBQUosQ0FBUCxLQUFvQixVQUFwQixJQUFrQyxPQUFLLGNBQUwsQ0FBb0IsR0FBcEIsRUFBeUIsSUFBSSxHQUFKLEVBQVMsSUFBVCxDQUFjLEdBQWQsQ0FBekIsQ0FBbEM7QUFDRCxXQUYwQixDQUEzQjtBQUdELFNBUEQ7QUFRRCxPQVRELE1BU087QUFDTCxhQUFLLGNBQUwsY0FBb0IsVUFBcEIsU0FBbUMsV0FBbkM7QUFDRDs7QUFFRCxhQUFPLElBQVA7QUFDRDs7Ozs7O0FBR0gsSUFBSSxNQUFKLEVBQVk7QUFDVixTQUFPLG1CQUFQLElBQThCLGlCQUE5QjtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxubGV0IG1pZGRsZXdhcmVNYW5hZ2VySGFzaCA9IFtdO1xuXG4vKipcbiAqIENvbXBvc2VzIHNpbmdsZS1hcmd1bWVudCBmdW5jdGlvbnMgZnJvbSByaWdodCB0byBsZWZ0LiBUaGUgcmlnaHRtb3N0XG4gKiBmdW5jdGlvbiBjYW4gdGFrZSBtdWx0aXBsZSBhcmd1bWVudHMgYXMgaXQgcHJvdmlkZXMgdGhlIHNpZ25hdHVyZSBmb3JcbiAqIHRoZSByZXN1bHRpbmcgY29tcG9zaXRlIGZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZ1bmNzIFRoZSBmdW5jdGlvbnMgdG8gY29tcG9zZS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiBvYnRhaW5lZCBieSBjb21wb3NpbmcgdGhlIGFyZ3VtZW50IGZ1bmN0aW9uc1xuICogZnJvbSByaWdodCB0byBsZWZ0LiBGb3IgZXhhbXBsZSwgY29tcG9zZShmLCBnLCBoKSBpcyBpZGVudGljYWwgdG8gZG9pbmdcbiAqICguLi5hcmdzKSA9PiBmKGcoaCguLi5hcmdzKSkpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9zZSguLi5mdW5jcykge1xuICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGFyZyA9PiBhcmc7XG4gIH1cblxuICBmdW5jcyA9IGZ1bmNzLmZpbHRlcihmdW5jID0+IHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nKTtcblxuICBpZiAoZnVuY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGZ1bmNzWzBdO1xuICB9XG5cbiAgY29uc3QgbGFzdCA9IGZ1bmNzW2Z1bmNzLmxlbmd0aCAtIDFdO1xuICBjb25zdCByZXN0ID0gZnVuY3Muc2xpY2UoMCwgLTEpO1xuICByZXR1cm4gKC4uLmFyZ3MpID0+IHJlc3QucmVkdWNlUmlnaHQoKGNvbXBvc2VkLCBmKSA9PiBmKGNvbXBvc2VkKSwgbGFzdCguLi5hcmdzKSk7XG59XG5cbi8qKlxuICogTWFuYWdlIG1pZGRsZXdhcmVzIGZvciBhbiBvYmplY3QuXG4gKiBNaWRkbGV3YXJlIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIHRoYXQgaGF2ZSBhY2Nlc3MgdG8gdGhlIHRhcmdldCBmdW5jdGlvbiBhbmQgaXQncyBhcmd1bWVudHMsXG4gKiBhbmQgdGhlIHRhcmdldCBvYmplY3QgYW5kIHRoZSBuZXh0IG1pZGRsZXdhcmUgZnVuY3Rpb24gaW4gdGhlIHRhcmdldCBmdW5jdGlvbiBjeWNsZS5cbiAqIFRoZSBuZXh0IG1pZGRsZXdhcmUgZnVuY3Rpb24gaXMgY29tbW9ubHkgZGVub3RlZCBieSBhIHZhcmlhYmxlIG5hbWVkIG5leHQuXG4gKlxuICogTWlkZGxld2FyZSBmdW5jdGlvbnMgY2FuIHBlcmZvcm0gdGhlIGZvbGxvd2luZyB0YXNrczpcbiAqICAtIEV4ZWN1dGUgYW55IGNvZGUuXG4gKiAgLSBNYWtlIGNoYW5nZXMgdG8gdGhlIGZ1bmN0aW9uJ3MgYXJndW1lbnRzLlxuICogIC0gRW5kIHRoZSB0YXJnZXQgZnVuY3Rpb24uXG4gKiAgLSBDYWxsIHRoZSBuZXh0IG1pZGRsZXdhcmUgaW4gdGhlIHN0YWNrLlxuICpcbiAqIElmIHRoZSBjdXJyZW50IG1pZGRsZXdhcmUgZnVuY3Rpb24gZG9lcyBub3QgZW5kIHRoZSB0YXJnZXQgZnVuY3Rpb24gY3ljbGUsXG4gKiBpdCBtdXN0IGNhbGwgbmV4dCgpIHRvIHBhc3MgY29udHJvbCB0byB0aGUgbmV4dCBtaWRkbGV3YXJlIGZ1bmN0aW9uLiBPdGhlcndpc2UsXG4gKiB0aGUgdGFyZ2V0IGZ1bmN0aW9uIHdpbGwgYmUgbGVmdCBoYW5naW5nLlxuICpcbiAqIGUuZy5cbiAqICBgYGBcbiAqICBjb25zdCB3YWxrID0gdGFyZ2V0ID0+IG5leHQgPT4gKC4uLmFyZ3MpID0+IHtcbiAqICAgICB0aGlzLmxvZyhgd2FsayBmdW5jdGlvbiBzdGFydC5gKTtcbiAqICAgICBjb25zdCByZXN1bHQgPSBuZXh0KC4uLmFyZ3MpO1xuICogICAgIHRoaXMubG9nKGB3YWxrIGZ1bmN0aW9uIGVuZC5gKTtcbiAqICAgICByZXR1cm4gcmVzdWx0O1xuICogICB9XG4gKiAgYGBgXG4gKlxuICogTWlkZGxld2FyZSBvYmplY3QgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZnVuY3Rpb24ncyBuYW1lIGFzIHNhbWUgYXMgdGhlIHRhcmdldCBvYmplY3QncyBmdW5jdGlvbiBuYW1lLlxuICpcbiAqIGUuZy5cbiAqICBgYGBcbiAqICBjb25zdCBMb2dnZXIgPSB7XG4gKiAgICAgIHdhbGs6IHRhcmdldCA9PiBuZXh0ID0+ICguLi5hcmdzKSA9PiB7XG4gKiAgICAgICAgY29uc29sZS5sb2coYHdhbGsgZnVuY3Rpb24gc3RhcnQuYCk7XG4gKiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV4dCguLi5hcmdzKTtcbiAqICAgICAgICBjb25zb2xlLmxvZyhgd2FsayBmdW5jdGlvbiBlbmQuYCk7XG4gKiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAqICAgICAgfVxuICogICB9XG4gKiAgYGBgXG4gKlxuICogRnVuY3Rpb24ncyBuYW1lIHN0YXJ0IG9yIGVuZCB3aXRoIFwiX1wiIHdpbGwgbm90IGJlIGFibGUgdG8gYXBwbHkgbWlkZGxld2FyZS5cbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICMjIEJhc2ljXG4gKlxuICogV2UgZGVmaW5lIGEgUGVyc29uIGNsYXNzLlxuICogLy8gdGhlIHRhcmdldCBvYmplY3RcbiAqIGNsYXNzIFBlcnNvbiB7XG4gKiAgIC8vIHRoZSB0YXJnZXQgZnVuY3Rpb25cbiAqICAgd2FsayhzdGVwKSB7XG4gKiAgICAgdGhpcy5zdGVwID0gc3RlcDtcbiAqICAgfVxuICpcbiAqICAgc3BlYWsod29yZCkge1xuICogICAgIHRoaXMud29yZCA9IHdvcmQ7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBUaGVuIHdlIGRlZmluZSBhIG1pZGRsZXdhcmUgZnVuY3Rpb24gdG8gcHJpbnQgbG9nLlxuICpcbiAqIC8vIG1pZGRsZXdhcmUgZm9yIHdhbGsgZnVuY3Rpb25cbiAqIGNvbnN0IGxvZ2dlciA9IHRhcmdldCA9PiBuZXh0ID0+ICguLi5hcmdzKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKGB3YWxrIHN0YXJ0LCBzdGVwczogJHthcmdzWzBdfS5gKTtcbiAqICAgY29uc3QgcmVzdWx0ID0gbmV4dCguLi5hcmdzKTtcbiAqICAgY29uc29sZS5sb2coYHdhbGsgZW5kLmApO1xuICogICByZXR1cm4gcmVzdWx0O1xuICogfVxuICpcbiAqIE5vdyB3ZSBhcHBseSB0aGUgbG9nIGZ1bmN0aW9uIGFzIGEgbWlkZGxld2FyZSB0byBhIFBlcnNvbiBpbnN0YW5jZS5cbiAqXG4gKiAvLyBhcHBseSBtaWRkbGV3YXJlIHRvIHRhcmdldCBvYmplY3RcbiAqIGNvbnN0IHAgPSBuZXcgUGVyc29uKCk7XG4gKiBjb25zdCBtaWRkbGV3YXJlTWFuYWdlciA9IG5ldyBNaWRkbGV3YXJlTWFuYWdlcihwKTtcbiAqIG1pZGRsZXdhcmVNYW5hZ2VyLnVzZSgnd2FsaycsIHdhbGspO1xuICogcC53YWxrKDMpO1xuICpcbiAqIFdoZW5ldmVyIGEgUGVyc29uIGluc3RhbmNlIGNhbGwgaXQncyB3YWxrIG1ldGhvZCwgd2UnbGwgc2VlIGxvZ3MgZnJvbSB0aGUgbG9vZ2VyIG1pZGRsZXdhcmUuXG4gKlxuICogIyMgTWlkZGxld2FyZSBvYmplY3RcbiAqIFdlIGNhbiBhbHNvIGFwcGx5IGEgbWlkZGxld2FyZSBvYmplY3QgdG8gYSB0YXJnZXQgb2JqZWN0LlxuICogTWlkZGxld2FyZSBvYmplY3QgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZnVuY3Rpb24ncyBuYW1lIGFzIHNhbWUgYXMgdGhlIHRhcmdldCBvYmplY3QncyBmdW5jdGlvbiBuYW1lLlxuICpcbiAqIGNvbnN0IFBlcnNvbk1pZGRsZXdhcmUge1xuICogICB3YWxrOiB0YXJnZXQgPT4gbmV4dCA9PiBzdGVwID0+IHtcbiAqICAgICBjb25zb2xlLmxvZyhgd2FsayBzdGFydCwgc3RlcHM6IHN0ZXAuYCk7XG4gKiAgICAgY29uc3QgcmVzdWx0ID0gbmV4dChzdGVwKTtcbiAqICAgICBjb25zb2xlLmxvZyhgd2FsayBlbmQuYCk7XG4gKiAgICAgcmV0dXJuIHJlc3VsdDtcbiAqICAgfSxcbiAqICAgc3BlYWs6IHRhcmdldCA9PiBuZXh0ID0+IHdvcmQgPT4ge1xuICogICAgIHdvcmQgPSAndGhpcyBpcyBhIG1pZGRsZXdhcmUgdHJ5aW5nIHRvIHNheTogJyArIHdvcmQ7XG4gKiAgICAgcmV0dXJuIG5leHQod29yZCk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiAvLyBhcHBseSBtaWRkbGV3YXJlIHRvIHRhcmdldCBvYmplY3RcbiAqIGNvbnN0IHAgPSBuZXcgUGVyc29uKCk7XG4gKiBjb25zdCBtaWRkbGV3YXJlTWFuYWdlciA9IG5ldyBNaWRkbGV3YXJlTWFuYWdlcihwKTtcbiAqIG1pZGRsZXdhcmVNYW5hZ2VyLnVzZShQZXJzb25NaWRkbGV3YXJlKTtcbiAqIHAud2FsaygzKTtcbiAqIHAuc3BlYWsoJ2hpJyk7XG4gKlxuICogIyMgbWlkZGxld2FyZU1ldGhvZHNcbiAqIE9yIHdlIGNhbiB1c2UgYG1pZGRsZXdhcmVNZXRob2RzYCB0byBkZWZpbmUgZnVuY3Rpb24gbmFtZXMgZm9yIG1pZGRsZXdhcmUgdGFyZ2V0IHdpdGhpbiBhIGNsYXNzLlxuICpcbiAqIGNsYXNzIFBlcnNvbk1pZGRsZXdhcmUge1xuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICAvL0RlZmluZSBmdW5jdGlvbiBuYW1lcyBmb3IgbWlkZGxld2FyZSB0YXJnZXQuXG4gKiAgICAgdGhpcy5taWRkbGV3YXJlTWV0aG9kcyA9IFsnd2FsaycsICdzcGVhayddO1xuICogICB9XG4gKiAgIGxvZyh0ZXh0KSB7XG4gKiAgICAgY29uc29sZS5sb2coJ01pZGRsZXdhcmUgbG9nOiAnICsgdGV4dCk7XG4gKiAgIH1cbiAqICAgd2Fsayh0YXJnZXQpIHtcbiAqICAgICByZXR1cm4gbmV4dCA9PiBzdGVwID0+IHtcbiAqICAgICAgIHRoaXMubG9nKGB3YWxrIHN0YXJ0LCBzdGVwczogc3RlcC5gKTtcbiAqICAgICAgIGNvbnN0IHJlc3VsdCA9IG5leHQoc3RlcCk7XG4gKiAgICAgICB0aGlzLmxvZyhgd2FsayBlbmQuYCk7XG4gKiAgICAgICByZXR1cm4gcmVzdWx0O1xuICogICAgIH1cbiAqICAgfVxuICogICBzcGVhayh0YXJnZXQpIHtcbiAqICAgICByZXR1cm4gbmV4dCA9PiB3b3JkID0+IHtcbiAqICAgICAgIHRoaXMubG9nKCd0aGlzIGlzIGEgbWlkZGxld2FyZSB0cnlpbmcgdG8gc2F5OiAnICsgd29yZCk7XG4gKiAgICAgICByZXR1cm4gbmV4dCh3b3JkKTtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiAvLyBhcHBseSBtaWRkbGV3YXJlIHRvIHRhcmdldCBvYmplY3RcbiAqIGNvbnN0IHAgPSBuZXcgUGVyc29uKCk7XG4gKiBjb25zdCBtaWRkbGV3YXJlTWFuYWdlciA9IG5ldyBNaWRkbGV3YXJlTWFuYWdlcihwKTtcbiAqIG1pZGRsZXdhcmVNYW5hZ2VyLnVzZShuZXcgUGVyc29uTWlkZGxld2FyZSgpKVxuICogcC53YWxrKDMpO1xuICogcC5zcGVhaygnaGknKTtcbiAqXG4gKi9cbmV4cG9ydCBjbGFzcyBNaWRkbGV3YXJlTWFuYWdlciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0LlxuICAgKiBAcGFyYW0gey4uLm9iamVjdH0gbWlkZGxld2FyZU9iamVjdHMgTWlkZGxld2FyZSBvYmplY3RzLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHRoaXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHRhcmdldCwgLi4ubWlkZGxld2FyZU9iamVjdHMpIHtcbiAgICBsZXQgaW5zdGFuY2UgPSBtaWRkbGV3YXJlTWFuYWdlckhhc2guZmluZChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICByZXR1cm4ga2V5Ll90YXJnZXQgPT09IHRhcmdldDtcbiAgICB9KTtcbiAgICAvLyBhIHRhcmdldCBjYW4gb25seSBoYXMgb25lIE1pZGRsZXdhcmVNYW5hZ2VyIGluc3RhbmNlXG4gICAgaWYgKGluc3RhbmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICAgIHRoaXMuX21ldGhvZHMgPSB7fTtcbiAgICAgIHRoaXMuX21ldGhvZE1pZGRsZXdhcmVzID0ge307XG4gICAgICBtaWRkbGV3YXJlTWFuYWdlckhhc2gucHVzaCh0aGlzKTtcbiAgICAgIGluc3RhbmNlID0gdGhpcztcbiAgICB9XG4gICAgaW5zdGFuY2UudXNlKC4uLm1pZGRsZXdhcmVPYmplY3RzKTtcblxuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuXG4gIF9hcHBseVRvTWV0aG9kKG1ldGhvZE5hbWUsIC4uLm1pZGRsZXdhcmVzKSB7XG4gICAgaWYgKHR5cGVvZiBtZXRob2ROYW1lID09PSAnc3RyaW5nJyAmJiAhL15fK3xfKyQvZy50ZXN0KG1ldGhvZE5hbWUpKSB7XG4gICAgICBsZXQgbWV0aG9kID0gdGhpcy5fbWV0aG9kc1ttZXRob2ROYW1lXSB8fCB0aGlzLl90YXJnZXRbbWV0aG9kTmFtZV07XG4gICAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aGlzLl9tZXRob2RzW21ldGhvZE5hbWVdID0gbWV0aG9kO1xuICAgICAgICBpZiAodGhpcy5fbWV0aG9kTWlkZGxld2FyZXNbbWV0aG9kTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHRoaXMuX21ldGhvZE1pZGRsZXdhcmVzW21ldGhvZE5hbWVdID0gW107XG4gICAgICAgIH1cbiAgICAgICAgbWlkZGxld2FyZXMuZm9yRWFjaChtaWRkbGV3YXJlID0+XG4gICAgICAgICAgdHlwZW9mIG1pZGRsZXdhcmUgPT09ICdmdW5jdGlvbicgJiYgdGhpcy5fbWV0aG9kTWlkZGxld2FyZXNbbWV0aG9kTmFtZV0ucHVzaChtaWRkbGV3YXJlKHRoaXMuX3RhcmdldCkpXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuX3RhcmdldFttZXRob2ROYW1lXSA9IGNvbXBvc2UoLi4udGhpcy5fbWV0aG9kTWlkZGxld2FyZXNbbWV0aG9kTmFtZV0pKG1ldGhvZC5iaW5kKHRoaXMuX3RhcmdldCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBseSAocmVnaXN0ZXIpIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRvIHRoZSB0YXJnZXQgZnVuY3Rpb24gb3IgYXBwbHkgKHJlZ2lzdGVyKSBtaWRkbGV3YXJlIG9iamVjdHMuXG4gICAqIElmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBhIG1pZGRsZXdhcmUgb2JqZWN0LCB0aGUgcmVzdCBhcmd1bWVudHMgbXVzdCBiZSBtaWRkbGV3YXJlIG9iamVjdHMuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gbWV0aG9kTmFtZSBTdHJpbmcgZm9yIHRhcmdldCBmdW5jdGlvbiBuYW1lLCBvYmplY3QgZm9yIGEgbWlkZGxld2FyZSBvYmplY3QuXG4gICAqIEBwYXJhbSB7Li4uZnVuY3Rpb258Li4ub2JqZWN0fSBtaWRkbGV3YXJlcyBUaGUgbWlkZGxld2FyZSBjaGFpbiB0byBiZSBhcHBsaWVkLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHRoaXNcbiAgICovXG4gIHVzZShtZXRob2ROYW1lLCAuLi5taWRkbGV3YXJlcykge1xuICAgIGlmICh0eXBlb2YgbWV0aG9kTmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykuZm9yRWFjaChhcmcgPT4ge1xuICAgICAgICAvLyBBIG1pZGRsZXdhcmUgb2JqZWN0IGNhbiBzcGVjaWZ5IHRhcmdldCBmdW5jdGlvbnMgd2l0aGluIG1pZGRsZXdhcmVNZXRob2RzIChBcnJheSkuXG4gICAgICAgIC8vIGUuZy4gb2JqLm1pZGRsZXdhcmVNZXRob2RzID0gWydtZXRob2QxJywgJ21ldGhvZDInXTtcbiAgICAgICAgLy8gb25seSBtZXRob2QxIGFuZCBtZXRob2QyIHdpbGwgYmUgdGhlIHRhcmdldCBmdW5jdGlvbi5cbiAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgKGFyZy5taWRkbGV3YXJlTWV0aG9kcyB8fCBPYmplY3Qua2V5cyhhcmcpKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgdHlwZW9mIGFyZ1trZXldID09PSAnZnVuY3Rpb24nICYmIHRoaXMuX2FwcGx5VG9NZXRob2Qoa2V5LCBhcmdba2V5XS5iaW5kKGFyZykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9hcHBseVRvTWV0aG9kKG1ldGhvZE5hbWUsIC4uLm1pZGRsZXdhcmVzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5pZiAod2luZG93KSB7XG4gIHdpbmRvd1snTWlkZGxld2FyZU1hbmFnZXInXSA9IE1pZGRsZXdhcmVNYW5hZ2VyO1xufVxuIl19
