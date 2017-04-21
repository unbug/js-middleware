(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var MiddlewareManager = function () {
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

exports.compose = compose;
exports.MiddlewareManager = MiddlewareManager;


if (window) {
  window['MiddlewareManager'] = MiddlewareManager;
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTWlkZGxld2FyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7Ozs7OztBQUVBLElBQUksd0JBQXdCLEVBQTVCOztBQUVBOzs7Ozs7Ozs7O0FBVUEsU0FBUyxPQUFULEdBQTJCO0FBQUEsb0NBQVAsS0FBTztBQUFQLFNBQU87QUFBQTs7QUFDekIsTUFBSSxNQUFNLE1BQU4sS0FBaUIsQ0FBckIsRUFBd0I7QUFDdEIsV0FBTztBQUFBLGFBQU8sR0FBUDtBQUFBLEtBQVA7QUFDRDs7QUFFRCxVQUFRLE1BQU0sTUFBTixDQUFhO0FBQUEsV0FBUSxPQUFPLElBQVAsS0FBZ0IsVUFBeEI7QUFBQSxHQUFiLENBQVI7O0FBRUEsTUFBSSxNQUFNLE1BQU4sS0FBaUIsQ0FBckIsRUFBd0I7QUFDdEIsV0FBTyxNQUFNLENBQU4sQ0FBUDtBQUNEOztBQUVELE1BQU0sT0FBTyxNQUFNLE1BQU0sTUFBTixHQUFlLENBQXJCLENBQWI7QUFDQSxNQUFNLE9BQU8sTUFBTSxLQUFOLENBQVksQ0FBWixFQUFlLENBQUMsQ0FBaEIsQ0FBYjtBQUNBLFNBQU87QUFBQSxXQUFhLEtBQUssV0FBTCxDQUFpQixVQUFDLFFBQUQsRUFBVyxDQUFYO0FBQUEsYUFBaUIsRUFBRSxRQUFGLENBQWpCO0FBQUEsS0FBakIsRUFBK0MsZ0NBQS9DLENBQWI7QUFBQSxHQUFQO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUEwSU0saUI7QUFDSjs7Ozs7QUFLQSw2QkFBWSxNQUFaLEVBQTBDO0FBQUE7O0FBQUE7O0FBQ3hDLFFBQUksV0FBVyxzQkFBc0IsSUFBdEIsQ0FBMkIsVUFBVSxHQUFWLEVBQWU7QUFDdkQsYUFBTyxJQUFJLE9BQUosS0FBZ0IsTUFBdkI7QUFDRCxLQUZjLENBQWY7QUFHQTtBQUNBLFFBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMxQixXQUFLLE9BQUwsR0FBZSxNQUFmO0FBQ0EsV0FBSyxRQUFMLEdBQWdCLEVBQWhCO0FBQ0EsV0FBSyxrQkFBTCxHQUEwQixFQUExQjtBQUNBLDRCQUFzQixJQUF0QixDQUEyQixJQUEzQjtBQUNBLGlCQUFXLElBQVg7QUFDRDs7QUFYdUMsdUNBQW5CLGlCQUFtQjtBQUFuQix1QkFBbUI7QUFBQTs7QUFZeEMsMkJBQVMsR0FBVCxrQkFBZ0IsaUJBQWhCOztBQUVBLFdBQU8sUUFBUDtBQUNEOzs7O21DQUVjLFUsRUFBNEI7QUFBQTs7QUFDekMsVUFBSSxPQUFPLFVBQVAsS0FBc0IsUUFBdEIsSUFBa0MsQ0FBQyxXQUFXLElBQVgsQ0FBZ0IsVUFBaEIsQ0FBdkMsRUFBb0U7QUFDbEUsWUFBSSxTQUFTLEtBQUssUUFBTCxDQUFjLFVBQWQsS0FBNkIsS0FBSyxPQUFMLENBQWEsVUFBYixDQUExQztBQUNBLFlBQUksT0FBTyxNQUFQLEtBQWtCLFVBQXRCLEVBQWtDO0FBQ2hDLGVBQUssUUFBTCxDQUFjLFVBQWQsSUFBNEIsTUFBNUI7QUFDQSxjQUFJLEtBQUssa0JBQUwsQ0FBd0IsVUFBeEIsTUFBd0MsU0FBNUMsRUFBdUQ7QUFDckQsaUJBQUssa0JBQUwsQ0FBd0IsVUFBeEIsSUFBc0MsRUFBdEM7QUFDRDs7QUFKK0IsNkNBSFIsV0FHUTtBQUhSLHVCQUdRO0FBQUE7O0FBS2hDLHNCQUFZLE9BQVosQ0FBb0I7QUFBQSxtQkFDbEIsT0FBTyxVQUFQLEtBQXNCLFVBQXRCLElBQW9DLE1BQUssa0JBQUwsQ0FBd0IsVUFBeEIsRUFBb0MsSUFBcEMsQ0FBeUMsV0FBVyxNQUFLLE9BQWhCLENBQXpDLENBRGxCO0FBQUEsV0FBcEI7QUFHQSxlQUFLLE9BQUwsQ0FBYSxVQUFiLElBQTJCLDRDQUFXLEtBQUssa0JBQUwsQ0FBd0IsVUFBeEIsQ0FBWCxHQUFnRCxPQUFPLElBQVAsQ0FBWSxLQUFLLE9BQWpCLENBQWhELENBQTNCO0FBQ0Q7QUFDRjtBQUNGOztBQUVEOzs7Ozs7Ozs7Ozt3QkFRSSxVLEVBQTRCO0FBQUE7O0FBQUEseUNBQWIsV0FBYTtBQUFiLG1CQUFhO0FBQUE7O0FBQzlCLFVBQUksUUFBTyxVQUFQLHlDQUFPLFVBQVAsT0FBc0IsUUFBMUIsRUFBb0M7QUFDbEMsY0FBTSxTQUFOLENBQWdCLEtBQWhCLENBQXNCLElBQXRCLENBQTJCLFNBQTNCLEVBQXNDLE9BQXRDLENBQThDLGVBQU87QUFDbkQ7QUFDQTtBQUNBO0FBQ0Esa0JBQU8sR0FBUCx5Q0FBTyxHQUFQLE9BQWUsUUFBZixJQUEyQixDQUFDLElBQUksaUJBQUosSUFBeUIsT0FBTyxJQUFQLENBQVksR0FBWixDQUExQixFQUE0QyxPQUE1QyxDQUFvRCxlQUFPO0FBQ3BGLG1CQUFPLElBQUksR0FBSixDQUFQLEtBQW9CLFVBQXBCLElBQWtDLE9BQUssY0FBTCxDQUFvQixHQUFwQixFQUF5QixJQUFJLEdBQUosRUFBUyxJQUFULENBQWMsR0FBZCxDQUF6QixDQUFsQztBQUNELFdBRjBCLENBQTNCO0FBR0QsU0FQRDtBQVFELE9BVEQsTUFTTztBQUNMLGFBQUssY0FBTCxjQUFvQixVQUFwQixTQUFtQyxXQUFuQztBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7UUFJRCxPLEdBQUEsTztRQUNBLGlCLEdBQUEsaUI7OztBQUdGLElBQUksTUFBSixFQUFZO0FBQ1YsU0FBTyxtQkFBUCxJQUE4QixpQkFBOUI7QUFDRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmxldCBtaWRkbGV3YXJlTWFuYWdlckhhc2ggPSBbXTtcblxuLyoqXG4gKiBDb21wb3NlcyBzaW5nbGUtYXJndW1lbnQgZnVuY3Rpb25zIGZyb20gcmlnaHQgdG8gbGVmdC4gVGhlIHJpZ2h0bW9zdFxuICogZnVuY3Rpb24gY2FuIHRha2UgbXVsdGlwbGUgYXJndW1lbnRzIGFzIGl0IHByb3ZpZGVzIHRoZSBzaWduYXR1cmUgZm9yXG4gKiB0aGUgcmVzdWx0aW5nIGNvbXBvc2l0ZSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBmdW5jcyBUaGUgZnVuY3Rpb25zIHRvIGNvbXBvc2UuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gb2J0YWluZWQgYnkgY29tcG9zaW5nIHRoZSBhcmd1bWVudCBmdW5jdGlvbnNcbiAqIGZyb20gcmlnaHQgdG8gbGVmdC4gRm9yIGV4YW1wbGUsIGNvbXBvc2UoZiwgZywgaCkgaXMgaWRlbnRpY2FsIHRvIGRvaW5nXG4gKiAoLi4uYXJncykgPT4gZihnKGgoLi4uYXJncykpKS5cbiAqL1xuZnVuY3Rpb24gY29tcG9zZSguLi5mdW5jcykge1xuICBpZiAoZnVuY3MubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGFyZyA9PiBhcmc7XG4gIH1cblxuICBmdW5jcyA9IGZ1bmNzLmZpbHRlcihmdW5jID0+IHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nKTtcblxuICBpZiAoZnVuY3MubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGZ1bmNzWzBdO1xuICB9XG5cbiAgY29uc3QgbGFzdCA9IGZ1bmNzW2Z1bmNzLmxlbmd0aCAtIDFdO1xuICBjb25zdCByZXN0ID0gZnVuY3Muc2xpY2UoMCwgLTEpO1xuICByZXR1cm4gKC4uLmFyZ3MpID0+IHJlc3QucmVkdWNlUmlnaHQoKGNvbXBvc2VkLCBmKSA9PiBmKGNvbXBvc2VkKSwgbGFzdCguLi5hcmdzKSk7XG59XG5cbi8qKlxuICogTWFuYWdlIG1pZGRsZXdhcmVzIGZvciBhbiBvYmplY3QuXG4gKiBNaWRkbGV3YXJlIGZ1bmN0aW9ucyBhcmUgZnVuY3Rpb25zIHRoYXQgaGF2ZSBhY2Nlc3MgdG8gdGhlIHRhcmdldCBmdW5jdGlvbiBhbmQgaXQncyBhcmd1bWVudHMsXG4gKiBhbmQgdGhlIHRhcmdldCBvYmplY3QgYW5kIHRoZSBuZXh0IG1pZGRsZXdhcmUgZnVuY3Rpb24gaW4gdGhlIHRhcmdldCBmdW5jdGlvbiBjeWNsZS5cbiAqIFRoZSBuZXh0IG1pZGRsZXdhcmUgZnVuY3Rpb24gaXMgY29tbW9ubHkgZGVub3RlZCBieSBhIHZhcmlhYmxlIG5hbWVkIG5leHQuXG4gKlxuICogTWlkZGxld2FyZSBmdW5jdGlvbnMgY2FuIHBlcmZvcm0gdGhlIGZvbGxvd2luZyB0YXNrczpcbiAqICAtIEV4ZWN1dGUgYW55IGNvZGUuXG4gKiAgLSBNYWtlIGNoYW5nZXMgdG8gdGhlIGZ1bmN0aW9uJ3MgYXJndW1lbnRzLlxuICogIC0gRW5kIHRoZSB0YXJnZXQgZnVuY3Rpb24uXG4gKiAgLSBDYWxsIHRoZSBuZXh0IG1pZGRsZXdhcmUgaW4gdGhlIHN0YWNrLlxuICpcbiAqIElmIHRoZSBjdXJyZW50IG1pZGRsZXdhcmUgZnVuY3Rpb24gZG9lcyBub3QgZW5kIHRoZSB0YXJnZXQgZnVuY3Rpb24gY3ljbGUsXG4gKiBpdCBtdXN0IGNhbGwgbmV4dCgpIHRvIHBhc3MgY29udHJvbCB0byB0aGUgbmV4dCBtaWRkbGV3YXJlIGZ1bmN0aW9uLiBPdGhlcndpc2UsXG4gKiB0aGUgdGFyZ2V0IGZ1bmN0aW9uIHdpbGwgYmUgbGVmdCBoYW5naW5nLlxuICpcbiAqIGUuZy5cbiAqICBgYGBcbiAqICBjb25zdCB3YWxrID0gdGFyZ2V0ID0+IG5leHQgPT4gKC4uLmFyZ3MpID0+IHtcbiAqICAgICB0aGlzLmxvZyhgd2FsayBmdW5jdGlvbiBzdGFydC5gKTtcbiAqICAgICBjb25zdCByZXN1bHQgPSBuZXh0KC4uLmFyZ3MpO1xuICogICAgIHRoaXMubG9nKGB3YWxrIGZ1bmN0aW9uIGVuZC5gKTtcbiAqICAgICByZXR1cm4gcmVzdWx0O1xuICogICB9XG4gKiAgYGBgXG4gKlxuICogTWlkZGxld2FyZSBvYmplY3QgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZnVuY3Rpb24ncyBuYW1lIGFzIHNhbWUgYXMgdGhlIHRhcmdldCBvYmplY3QncyBmdW5jdGlvbiBuYW1lLlxuICpcbiAqIGUuZy5cbiAqICBgYGBcbiAqICBjb25zdCBMb2dnZXIgPSB7XG4gKiAgICAgIHdhbGs6IHRhcmdldCA9PiBuZXh0ID0+ICguLi5hcmdzKSA9PiB7XG4gKiAgICAgICAgY29uc29sZS5sb2coYHdhbGsgZnVuY3Rpb24gc3RhcnQuYCk7XG4gKiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV4dCguLi5hcmdzKTtcbiAqICAgICAgICBjb25zb2xlLmxvZyhgd2FsayBmdW5jdGlvbiBlbmQuYCk7XG4gKiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAqICAgICAgfVxuICogICB9XG4gKiAgYGBgXG4gKlxuICogRnVuY3Rpb24ncyBuYW1lIHN0YXJ0IG9yIGVuZCB3aXRoIFwiX1wiIHdpbGwgbm90IGJlIGFibGUgdG8gYXBwbHkgbWlkZGxld2FyZS5cbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqICMjIEJhc2ljXG4gKlxuICogV2UgZGVmaW5lIGEgUGVyc29uIGNsYXNzLlxuICogLy8gdGhlIHRhcmdldCBvYmplY3RcbiAqIGNsYXNzIFBlcnNvbiB7XG4gKiAgIC8vIHRoZSB0YXJnZXQgZnVuY3Rpb25cbiAqICAgd2FsayhzdGVwKSB7XG4gKiAgICAgdGhpcy5zdGVwID0gc3RlcDtcbiAqICAgfVxuICpcbiAqICAgc3BlYWsod29yZCkge1xuICogICAgIHRoaXMud29yZCA9IHdvcmQ7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBUaGVuIHdlIGRlZmluZSBhIG1pZGRsZXdhcmUgZnVuY3Rpb24gdG8gcHJpbnQgbG9nLlxuICpcbiAqIC8vIG1pZGRsZXdhcmUgZm9yIHdhbGsgZnVuY3Rpb25cbiAqIGNvbnN0IGxvZ2dlciA9IHRhcmdldCA9PiBuZXh0ID0+ICguLi5hcmdzKSA9PiB7XG4gKiAgIGNvbnNvbGUubG9nKGB3YWxrIHN0YXJ0LCBzdGVwczogJHthcmdzWzBdfS5gKTtcbiAqICAgY29uc3QgcmVzdWx0ID0gbmV4dCguLi5hcmdzKTtcbiAqICAgY29uc29sZS5sb2coYHdhbGsgZW5kLmApO1xuICogICByZXR1cm4gcmVzdWx0O1xuICogfVxuICpcbiAqIE5vdyB3ZSBhcHBseSB0aGUgbG9nIGZ1bmN0aW9uIGFzIGEgbWlkZGxld2FyZSB0byBhIFBlcnNvbiBpbnN0YW5jZS5cbiAqXG4gKiAvLyBhcHBseSBtaWRkbGV3YXJlIHRvIHRhcmdldCBvYmplY3RcbiAqIGNvbnN0IHAgPSBuZXcgUGVyc29uKCk7XG4gKiBjb25zdCBtaWRkbGV3YXJlTWFuYWdlciA9IG5ldyBNaWRkbGV3YXJlTWFuYWdlcihwKTtcbiAqIG1pZGRsZXdhcmVNYW5hZ2VyLnVzZSgnd2FsaycsIHdhbGspO1xuICogcC53YWxrKDMpO1xuICpcbiAqIFdoZW5ldmVyIGEgUGVyc29uIGluc3RhbmNlIGNhbGwgaXQncyB3YWxrIG1ldGhvZCwgd2UnbGwgc2VlIGxvZ3MgZnJvbSB0aGUgbG9vZ2VyIG1pZGRsZXdhcmUuXG4gKlxuICogIyMgTWlkZGxld2FyZSBvYmplY3RcbiAqIFdlIGNhbiBhbHNvIGFwcGx5IGEgbWlkZGxld2FyZSBvYmplY3QgdG8gYSB0YXJnZXQgb2JqZWN0LlxuICogTWlkZGxld2FyZSBvYmplY3QgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZnVuY3Rpb24ncyBuYW1lIGFzIHNhbWUgYXMgdGhlIHRhcmdldCBvYmplY3QncyBmdW5jdGlvbiBuYW1lLlxuICpcbiAqIGNvbnN0IFBlcnNvbk1pZGRsZXdhcmUge1xuICogICB3YWxrOiB0YXJnZXQgPT4gbmV4dCA9PiBzdGVwID0+IHtcbiAqICAgICBjb25zb2xlLmxvZyhgd2FsayBzdGFydCwgc3RlcHM6IHN0ZXAuYCk7XG4gKiAgICAgY29uc3QgcmVzdWx0ID0gbmV4dChzdGVwKTtcbiAqICAgICBjb25zb2xlLmxvZyhgd2FsayBlbmQuYCk7XG4gKiAgICAgcmV0dXJuIHJlc3VsdDtcbiAqICAgfSxcbiAqICAgc3BlYWs6IHRhcmdldCA9PiBuZXh0ID0+IHdvcmQgPT4ge1xuICogICAgIHdvcmQgPSAndGhpcyBpcyBhIG1pZGRsZXdhcmUgdHJ5aW5nIHRvIHNheTogJyArIHdvcmQ7XG4gKiAgICAgcmV0dXJuIG5leHQod29yZCk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiAvLyBhcHBseSBtaWRkbGV3YXJlIHRvIHRhcmdldCBvYmplY3RcbiAqIGNvbnN0IHAgPSBuZXcgUGVyc29uKCk7XG4gKiBjb25zdCBtaWRkbGV3YXJlTWFuYWdlciA9IG5ldyBNaWRkbGV3YXJlTWFuYWdlcihwKTtcbiAqIG1pZGRsZXdhcmVNYW5hZ2VyLnVzZShQZXJzb25NaWRkbGV3YXJlKTtcbiAqIHAud2FsaygzKTtcbiAqIHAuc3BlYWsoJ2hpJyk7XG4gKlxuICogIyMgbWlkZGxld2FyZU1ldGhvZHNcbiAqIE9yIHdlIGNhbiB1c2UgYG1pZGRsZXdhcmVNZXRob2RzYCB0byBkZWZpbmUgZnVuY3Rpb24gbmFtZXMgZm9yIG1pZGRsZXdhcmUgdGFyZ2V0IHdpdGhpbiBhIGNsYXNzLlxuICpcbiAqIGNsYXNzIFBlcnNvbk1pZGRsZXdhcmUge1xuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICAvL0RlZmluZSBmdW5jdGlvbiBuYW1lcyBmb3IgbWlkZGxld2FyZSB0YXJnZXQuXG4gKiAgICAgdGhpcy5taWRkbGV3YXJlTWV0aG9kcyA9IFsnd2FsaycsICdzcGVhayddO1xuICogICB9XG4gKiAgIGxvZyh0ZXh0KSB7XG4gKiAgICAgY29uc29sZS5sb2coJ01pZGRsZXdhcmUgbG9nOiAnICsgdGV4dCk7XG4gKiAgIH1cbiAqICAgd2Fsayh0YXJnZXQpIHtcbiAqICAgICByZXR1cm4gbmV4dCA9PiBzdGVwID0+IHtcbiAqICAgICAgIHRoaXMubG9nKGB3YWxrIHN0YXJ0LCBzdGVwczogc3RlcC5gKTtcbiAqICAgICAgIGNvbnN0IHJlc3VsdCA9IG5leHQoc3RlcCk7XG4gKiAgICAgICB0aGlzLmxvZyhgd2FsayBlbmQuYCk7XG4gKiAgICAgICByZXR1cm4gcmVzdWx0O1xuICogICAgIH1cbiAqICAgfVxuICogICBzcGVhayh0YXJnZXQpIHtcbiAqICAgICByZXR1cm4gbmV4dCA9PiB3b3JkID0+IHtcbiAqICAgICAgIHRoaXMubG9nKCd0aGlzIGlzIGEgbWlkZGxld2FyZSB0cnlpbmcgdG8gc2F5OiAnICsgd29yZCk7XG4gKiAgICAgICByZXR1cm4gbmV4dCh3b3JkKTtcbiAqICAgICB9XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiAvLyBhcHBseSBtaWRkbGV3YXJlIHRvIHRhcmdldCBvYmplY3RcbiAqIGNvbnN0IHAgPSBuZXcgUGVyc29uKCk7XG4gKiBjb25zdCBtaWRkbGV3YXJlTWFuYWdlciA9IG5ldyBNaWRkbGV3YXJlTWFuYWdlcihwKTtcbiAqIG1pZGRsZXdhcmVNYW5hZ2VyLnVzZShuZXcgUGVyc29uTWlkZGxld2FyZSgpKVxuICogcC53YWxrKDMpO1xuICogcC5zcGVhaygnaGknKTtcbiAqXG4gKi9cbmNsYXNzIE1pZGRsZXdhcmVNYW5hZ2VyIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3QuXG4gICAqIEBwYXJhbSB7Li4ub2JqZWN0fSBtaWRkbGV3YXJlT2JqZWN0cyBNaWRkbGV3YXJlIG9iamVjdHMuXG4gICAqIEByZXR1cm4ge29iamVjdH0gdGhpc1xuICAgKi9cbiAgY29uc3RydWN0b3IodGFyZ2V0LCAuLi5taWRkbGV3YXJlT2JqZWN0cykge1xuICAgIGxldCBpbnN0YW5jZSA9IG1pZGRsZXdhcmVNYW5hZ2VySGFzaC5maW5kKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIHJldHVybiBrZXkuX3RhcmdldCA9PT0gdGFyZ2V0O1xuICAgIH0pO1xuICAgIC8vIGEgdGFyZ2V0IGNhbiBvbmx5IGhhcyBvbmUgTWlkZGxld2FyZU1hbmFnZXIgaW5zdGFuY2VcbiAgICBpZiAoaW5zdGFuY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgdGhpcy5fbWV0aG9kcyA9IHt9O1xuICAgICAgdGhpcy5fbWV0aG9kTWlkZGxld2FyZXMgPSB7fTtcbiAgICAgIG1pZGRsZXdhcmVNYW5hZ2VySGFzaC5wdXNoKHRoaXMpO1xuICAgICAgaW5zdGFuY2UgPSB0aGlzO1xuICAgIH1cbiAgICBpbnN0YW5jZS51c2UoLi4ubWlkZGxld2FyZU9iamVjdHMpO1xuXG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG5cbiAgX2FwcGx5VG9NZXRob2QobWV0aG9kTmFtZSwgLi4ubWlkZGxld2FyZXMpIHtcbiAgICBpZiAodHlwZW9mIG1ldGhvZE5hbWUgPT09ICdzdHJpbmcnICYmICEvXl8rfF8rJC9nLnRlc3QobWV0aG9kTmFtZSkpIHtcbiAgICAgIGxldCBtZXRob2QgPSB0aGlzLl9tZXRob2RzW21ldGhvZE5hbWVdIHx8IHRoaXMuX3RhcmdldFttZXRob2ROYW1lXTtcbiAgICAgIGlmICh0eXBlb2YgbWV0aG9kID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuX21ldGhvZHNbbWV0aG9kTmFtZV0gPSBtZXRob2Q7XG4gICAgICAgIGlmICh0aGlzLl9tZXRob2RNaWRkbGV3YXJlc1ttZXRob2ROYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdGhpcy5fbWV0aG9kTWlkZGxld2FyZXNbbWV0aG9kTmFtZV0gPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBtaWRkbGV3YXJlcy5mb3JFYWNoKG1pZGRsZXdhcmUgPT5cbiAgICAgICAgICB0eXBlb2YgbWlkZGxld2FyZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0aGlzLl9tZXRob2RNaWRkbGV3YXJlc1ttZXRob2ROYW1lXS5wdXNoKG1pZGRsZXdhcmUodGhpcy5fdGFyZ2V0KSlcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5fdGFyZ2V0W21ldGhvZE5hbWVdID0gY29tcG9zZSguLi50aGlzLl9tZXRob2RNaWRkbGV3YXJlc1ttZXRob2ROYW1lXSkobWV0aG9kLmJpbmQodGhpcy5fdGFyZ2V0KSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IChyZWdpc3RlcikgbWlkZGxld2FyZSBmdW5jdGlvbnMgdG8gdGhlIHRhcmdldCBmdW5jdGlvbiBvciBhcHBseSAocmVnaXN0ZXIpIG1pZGRsZXdhcmUgb2JqZWN0cy5cbiAgICogSWYgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGEgbWlkZGxld2FyZSBvYmplY3QsIHRoZSByZXN0IGFyZ3VtZW50cyBtdXN0IGJlIG1pZGRsZXdhcmUgb2JqZWN0cy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBtZXRob2ROYW1lIFN0cmluZyBmb3IgdGFyZ2V0IGZ1bmN0aW9uIG5hbWUsIG9iamVjdCBmb3IgYSBtaWRkbGV3YXJlIG9iamVjdC5cbiAgICogQHBhcmFtIHsuLi5mdW5jdGlvbnwuLi5vYmplY3R9IG1pZGRsZXdhcmVzIFRoZSBtaWRkbGV3YXJlIGNoYWluIHRvIGJlIGFwcGxpZWQuXG4gICAqIEByZXR1cm4ge29iamVjdH0gdGhpc1xuICAgKi9cbiAgdXNlKG1ldGhvZE5hbWUsIC4uLm1pZGRsZXdhcmVzKSB7XG4gICAgaWYgKHR5cGVvZiBtZXRob2ROYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKS5mb3JFYWNoKGFyZyA9PiB7XG4gICAgICAgIC8vIEEgbWlkZGxld2FyZSBvYmplY3QgY2FuIHNwZWNpZnkgdGFyZ2V0IGZ1bmN0aW9ucyB3aXRoaW4gbWlkZGxld2FyZU1ldGhvZHMgKEFycmF5KS5cbiAgICAgICAgLy8gZS5nLiBvYmoubWlkZGxld2FyZU1ldGhvZHMgPSBbJ21ldGhvZDEnLCAnbWV0aG9kMiddO1xuICAgICAgICAvLyBvbmx5IG1ldGhvZDEgYW5kIG1ldGhvZDIgd2lsbCBiZSB0aGUgdGFyZ2V0IGZ1bmN0aW9uLlxuICAgICAgICB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiAoYXJnLm1pZGRsZXdhcmVNZXRob2RzIHx8IE9iamVjdC5rZXlzKGFyZykpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICB0eXBlb2YgYXJnW2tleV0gPT09ICdmdW5jdGlvbicgJiYgdGhpcy5fYXBwbHlUb01ldGhvZChrZXksIGFyZ1trZXldLmJpbmQoYXJnKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2FwcGx5VG9NZXRob2QobWV0aG9kTmFtZSwgLi4ubWlkZGxld2FyZXMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCB7XG4gIGNvbXBvc2UsXG4gIE1pZGRsZXdhcmVNYW5hZ2VyXG59XG5cbmlmICh3aW5kb3cpIHtcbiAgd2luZG93WydNaWRkbGV3YXJlTWFuYWdlciddID0gTWlkZGxld2FyZU1hbmFnZXI7XG59XG4iXX0=
