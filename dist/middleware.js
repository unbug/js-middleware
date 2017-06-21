(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jsMiddleware = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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
 * middlewareManager.use('walk', logger);
 * p.walk(3);
 *
 * Whenever a Person instance call it's walk method, we'll see logs from the looger middleware.
 *
 * ## Middleware object
 * We can also apply a middleware object to a target object.
 * Middleware object is an object that contains function's name as same as the target object's function name.
 *
 * const PersonMiddleware = {
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
 * In a class, function's name start or end with "_" will not be able to apply as middleware.
 * Or we can use `middlewareMethods` to define function names for middleware target within a class.
 *
 * class PersonMiddleware {
 *   constructor() {
 *     // Or Define function names for middleware target.
 *     this.middlewareMethods = ['walk', 'speak'];
 *   }
 *   // Function's name start or end with "_" will not be able to apply as middleware.
 *   _getPrefix() {
 *     return 'Middleware log: ';
 *   }
 *   log(text) {
 *     console.log(this._getPrefix() + text);
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

  // Function's name start or end with "_" will not be able to apply middleware.


  _createClass(MiddlewareManager, [{
    key: '_methodIsValid',
    value: function _methodIsValid(methodName) {
      return !/^_+|_+$|constructor/g.test(methodName);
    }

    // Apply middleware to method

  }, {
    key: '_applyToMethod',
    value: function _applyToMethod(methodName) {
      var _this = this;

      if (typeof methodName === 'string' && this._methodIsValid(methodName)) {
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
          (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && (arg.middlewareMethods || (Object.keys(arg).length ? Object.keys(arg) : Object.getOwnPropertyNames(Object.getPrototypeOf(arg)))).forEach(function (key) {
            typeof arg[key] === 'function' && _this2._methodIsValid(key) && _this2._applyToMethod(key, arg[key].bind(arg));
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

if (typeof window !== 'undefined') {
  window['MiddlewareManager'] = MiddlewareManager;
}

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvTWlkZGxld2FyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOzs7Ozs7Ozs7O1FBYWdCLE8sR0FBQSxPOzs7Ozs7QUFaaEIsSUFBSSx3QkFBd0IsRUFBNUI7O0FBRUE7Ozs7Ozs7Ozs7QUFVTyxTQUFTLE9BQVQsR0FBMkI7QUFBQSxvQ0FBUCxLQUFPO0FBQVAsU0FBTztBQUFBOztBQUNoQyxNQUFJLE1BQU0sTUFBTixLQUFpQixDQUFyQixFQUF3QjtBQUN0QixXQUFPO0FBQUEsYUFBTyxHQUFQO0FBQUEsS0FBUDtBQUNEOztBQUVELFVBQVEsTUFBTSxNQUFOLENBQWE7QUFBQSxXQUFRLE9BQU8sSUFBUCxLQUFnQixVQUF4QjtBQUFBLEdBQWIsQ0FBUjs7QUFFQSxNQUFJLE1BQU0sTUFBTixLQUFpQixDQUFyQixFQUF3QjtBQUN0QixXQUFPLE1BQU0sQ0FBTixDQUFQO0FBQ0Q7O0FBRUQsTUFBTSxPQUFPLE1BQU0sTUFBTSxNQUFOLEdBQWUsQ0FBckIsQ0FBYjtBQUNBLE1BQU0sT0FBTyxNQUFNLEtBQU4sQ0FBWSxDQUFaLEVBQWUsQ0FBQyxDQUFoQixDQUFiO0FBQ0EsU0FBTztBQUFBLFdBQWEsS0FBSyxXQUFMLENBQWlCLFVBQUMsUUFBRCxFQUFXLENBQVg7QUFBQSxhQUFpQixFQUFFLFFBQUYsQ0FBakI7QUFBQSxLQUFqQixFQUErQyxnQ0FBL0MsQ0FBYjtBQUFBLEdBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBK0lhLGlCLFdBQUEsaUI7QUFDWDs7Ozs7QUFLQSw2QkFBWSxNQUFaLEVBQTBDO0FBQUE7O0FBQUE7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LG1CQUFQLElBQThCLGlCQUE5QjtBQUNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcbmxldCBtaWRkbGV3YXJlTWFuYWdlckhhc2ggPSBbXTtcblxuLyoqXG4gKiBDb21wb3NlcyBzaW5nbGUtYXJndW1lbnQgZnVuY3Rpb25zIGZyb20gcmlnaHQgdG8gbGVmdC4gVGhlIHJpZ2h0bW9zdFxuICogZnVuY3Rpb24gY2FuIHRha2UgbXVsdGlwbGUgYXJndW1lbnRzIGFzIGl0IHByb3ZpZGVzIHRoZSBzaWduYXR1cmUgZm9yXG4gKiB0aGUgcmVzdWx0aW5nIGNvbXBvc2l0ZSBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gey4uLkZ1bmN0aW9ufSBmdW5jcyBUaGUgZnVuY3Rpb25zIHRvIGNvbXBvc2UuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IEEgZnVuY3Rpb24gb2J0YWluZWQgYnkgY29tcG9zaW5nIHRoZSBhcmd1bWVudCBmdW5jdGlvbnNcbiAqIGZyb20gcmlnaHQgdG8gbGVmdC4gRm9yIGV4YW1wbGUsIGNvbXBvc2UoZiwgZywgaCkgaXMgaWRlbnRpY2FsIHRvIGRvaW5nXG4gKiAoLi4uYXJncykgPT4gZihnKGgoLi4uYXJncykpKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvc2UoLi4uZnVuY3MpIHtcbiAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBhcmcgPT4gYXJnO1xuICB9XG5cbiAgZnVuY3MgPSBmdW5jcy5maWx0ZXIoZnVuYyA9PiB0eXBlb2YgZnVuYyA9PT0gJ2Z1bmN0aW9uJyk7XG5cbiAgaWYgKGZ1bmNzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBmdW5jc1swXTtcbiAgfVxuXG4gIGNvbnN0IGxhc3QgPSBmdW5jc1tmdW5jcy5sZW5ndGggLSAxXTtcbiAgY29uc3QgcmVzdCA9IGZ1bmNzLnNsaWNlKDAsIC0xKTtcbiAgcmV0dXJuICguLi5hcmdzKSA9PiByZXN0LnJlZHVjZVJpZ2h0KChjb21wb3NlZCwgZikgPT4gZihjb21wb3NlZCksIGxhc3QoLi4uYXJncykpO1xufVxuXG4vKipcbiAqIE1hbmFnZSBtaWRkbGV3YXJlcyBmb3IgYW4gb2JqZWN0LlxuICogTWlkZGxld2FyZSBmdW5jdGlvbnMgYXJlIGZ1bmN0aW9ucyB0aGF0IGhhdmUgYWNjZXNzIHRvIHRoZSB0YXJnZXQgZnVuY3Rpb24gYW5kIGl0J3MgYXJndW1lbnRzLFxuICogYW5kIHRoZSB0YXJnZXQgb2JqZWN0IGFuZCB0aGUgbmV4dCBtaWRkbGV3YXJlIGZ1bmN0aW9uIGluIHRoZSB0YXJnZXQgZnVuY3Rpb24gY3ljbGUuXG4gKiBUaGUgbmV4dCBtaWRkbGV3YXJlIGZ1bmN0aW9uIGlzIGNvbW1vbmx5IGRlbm90ZWQgYnkgYSB2YXJpYWJsZSBuYW1lZCBuZXh0LlxuICpcbiAqIE1pZGRsZXdhcmUgZnVuY3Rpb25zIGNhbiBwZXJmb3JtIHRoZSBmb2xsb3dpbmcgdGFza3M6XG4gKiAgLSBFeGVjdXRlIGFueSBjb2RlLlxuICogIC0gTWFrZSBjaGFuZ2VzIHRvIHRoZSBmdW5jdGlvbidzIGFyZ3VtZW50cy5cbiAqICAtIEVuZCB0aGUgdGFyZ2V0IGZ1bmN0aW9uLlxuICogIC0gQ2FsbCB0aGUgbmV4dCBtaWRkbGV3YXJlIGluIHRoZSBzdGFjay5cbiAqXG4gKiBJZiB0aGUgY3VycmVudCBtaWRkbGV3YXJlIGZ1bmN0aW9uIGRvZXMgbm90IGVuZCB0aGUgdGFyZ2V0IGZ1bmN0aW9uIGN5Y2xlLFxuICogaXQgbXVzdCBjYWxsIG5leHQoKSB0byBwYXNzIGNvbnRyb2wgdG8gdGhlIG5leHQgbWlkZGxld2FyZSBmdW5jdGlvbi4gT3RoZXJ3aXNlLFxuICogdGhlIHRhcmdldCBmdW5jdGlvbiB3aWxsIGJlIGxlZnQgaGFuZ2luZy5cbiAqXG4gKiBlLmcuXG4gKiAgYGBgXG4gKiAgY29uc3Qgd2FsayA9IHRhcmdldCA9PiBuZXh0ID0+ICguLi5hcmdzKSA9PiB7XG4gKiAgICAgdGhpcy5sb2coYHdhbGsgZnVuY3Rpb24gc3RhcnQuYCk7XG4gKiAgICAgY29uc3QgcmVzdWx0ID0gbmV4dCguLi5hcmdzKTtcbiAqICAgICB0aGlzLmxvZyhgd2FsayBmdW5jdGlvbiBlbmQuYCk7XG4gKiAgICAgcmV0dXJuIHJlc3VsdDtcbiAqICAgfVxuICogIGBgYFxuICpcbiAqIE1pZGRsZXdhcmUgb2JqZWN0IGlzIGFuIG9iamVjdCB0aGF0IGNvbnRhaW5zIGZ1bmN0aW9uJ3MgbmFtZSBhcyBzYW1lIGFzIHRoZSB0YXJnZXQgb2JqZWN0J3MgZnVuY3Rpb24gbmFtZS5cbiAqXG4gKiBlLmcuXG4gKiAgYGBgXG4gKiAgY29uc3QgTG9nZ2VyID0ge1xuICogICAgICB3YWxrOiB0YXJnZXQgPT4gbmV4dCA9PiAoLi4uYXJncykgPT4ge1xuICogICAgICAgIGNvbnNvbGUubG9nKGB3YWxrIGZ1bmN0aW9uIHN0YXJ0LmApO1xuICogICAgICAgIGNvbnN0IHJlc3VsdCA9IG5leHQoLi4uYXJncyk7XG4gKiAgICAgICAgY29uc29sZS5sb2coYHdhbGsgZnVuY3Rpb24gZW5kLmApO1xuICogICAgICAgIHJldHVybiByZXN1bHQ7XG4gKiAgICAgIH1cbiAqICAgfVxuICogIGBgYFxuICpcbiAqIEZ1bmN0aW9uJ3MgbmFtZSBzdGFydCBvciBlbmQgd2l0aCBcIl9cIiB3aWxsIG5vdCBiZSBhYmxlIHRvIGFwcGx5IG1pZGRsZXdhcmUuXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAjIyBCYXNpY1xuICpcbiAqIFdlIGRlZmluZSBhIFBlcnNvbiBjbGFzcy5cbiAqIC8vIHRoZSB0YXJnZXQgb2JqZWN0XG4gKiBjbGFzcyBQZXJzb24ge1xuICogICAvLyB0aGUgdGFyZ2V0IGZ1bmN0aW9uXG4gKiAgIHdhbGsoc3RlcCkge1xuICogICAgIHRoaXMuc3RlcCA9IHN0ZXA7XG4gKiAgIH1cbiAqXG4gKiAgIHNwZWFrKHdvcmQpIHtcbiAqICAgICB0aGlzLndvcmQgPSB3b3JkO1xuICogICB9XG4gKiB9XG4gKlxuICogVGhlbiB3ZSBkZWZpbmUgYSBtaWRkbGV3YXJlIGZ1bmN0aW9uIHRvIHByaW50IGxvZy5cbiAqXG4gKiAvLyBtaWRkbGV3YXJlIGZvciB3YWxrIGZ1bmN0aW9uXG4gKiBjb25zdCBsb2dnZXIgPSB0YXJnZXQgPT4gbmV4dCA9PiAoLi4uYXJncykgPT4ge1xuICogICBjb25zb2xlLmxvZyhgd2FsayBzdGFydCwgc3RlcHM6ICR7YXJnc1swXX0uYCk7XG4gKiAgIGNvbnN0IHJlc3VsdCA9IG5leHQoLi4uYXJncyk7XG4gKiAgIGNvbnNvbGUubG9nKGB3YWxrIGVuZC5gKTtcbiAqICAgcmV0dXJuIHJlc3VsdDtcbiAqIH1cbiAqXG4gKiBOb3cgd2UgYXBwbHkgdGhlIGxvZyBmdW5jdGlvbiBhcyBhIG1pZGRsZXdhcmUgdG8gYSBQZXJzb24gaW5zdGFuY2UuXG4gKlxuICogLy8gYXBwbHkgbWlkZGxld2FyZSB0byB0YXJnZXQgb2JqZWN0XG4gKiBjb25zdCBwID0gbmV3IFBlcnNvbigpO1xuICogY29uc3QgbWlkZGxld2FyZU1hbmFnZXIgPSBuZXcgTWlkZGxld2FyZU1hbmFnZXIocCk7XG4gKiBtaWRkbGV3YXJlTWFuYWdlci51c2UoJ3dhbGsnLCBsb2dnZXIpO1xuICogcC53YWxrKDMpO1xuICpcbiAqIFdoZW5ldmVyIGEgUGVyc29uIGluc3RhbmNlIGNhbGwgaXQncyB3YWxrIG1ldGhvZCwgd2UnbGwgc2VlIGxvZ3MgZnJvbSB0aGUgbG9vZ2VyIG1pZGRsZXdhcmUuXG4gKlxuICogIyMgTWlkZGxld2FyZSBvYmplY3RcbiAqIFdlIGNhbiBhbHNvIGFwcGx5IGEgbWlkZGxld2FyZSBvYmplY3QgdG8gYSB0YXJnZXQgb2JqZWN0LlxuICogTWlkZGxld2FyZSBvYmplY3QgaXMgYW4gb2JqZWN0IHRoYXQgY29udGFpbnMgZnVuY3Rpb24ncyBuYW1lIGFzIHNhbWUgYXMgdGhlIHRhcmdldCBvYmplY3QncyBmdW5jdGlvbiBuYW1lLlxuICpcbiAqIGNvbnN0IFBlcnNvbk1pZGRsZXdhcmUgPSB7XG4gKiAgIHdhbGs6IHRhcmdldCA9PiBuZXh0ID0+IHN0ZXAgPT4ge1xuICogICAgIGNvbnNvbGUubG9nKGB3YWxrIHN0YXJ0LCBzdGVwczogc3RlcC5gKTtcbiAqICAgICBjb25zdCByZXN1bHQgPSBuZXh0KHN0ZXApO1xuICogICAgIGNvbnNvbGUubG9nKGB3YWxrIGVuZC5gKTtcbiAqICAgICByZXR1cm4gcmVzdWx0O1xuICogICB9LFxuICogICBzcGVhazogdGFyZ2V0ID0+IG5leHQgPT4gd29yZCA9PiB7XG4gKiAgICAgd29yZCA9ICd0aGlzIGlzIGEgbWlkZGxld2FyZSB0cnlpbmcgdG8gc2F5OiAnICsgd29yZDtcbiAqICAgICByZXR1cm4gbmV4dCh3b3JkKTtcbiAqICAgfVxuICogfVxuICpcbiAqIC8vIGFwcGx5IG1pZGRsZXdhcmUgdG8gdGFyZ2V0IG9iamVjdFxuICogY29uc3QgcCA9IG5ldyBQZXJzb24oKTtcbiAqIGNvbnN0IG1pZGRsZXdhcmVNYW5hZ2VyID0gbmV3IE1pZGRsZXdhcmVNYW5hZ2VyKHApO1xuICogbWlkZGxld2FyZU1hbmFnZXIudXNlKFBlcnNvbk1pZGRsZXdhcmUpO1xuICogcC53YWxrKDMpO1xuICogcC5zcGVhaygnaGknKTtcbiAqXG4gKiAjIyBtaWRkbGV3YXJlTWV0aG9kc1xuICogSW4gYSBjbGFzcywgZnVuY3Rpb24ncyBuYW1lIHN0YXJ0IG9yIGVuZCB3aXRoIFwiX1wiIHdpbGwgbm90IGJlIGFibGUgdG8gYXBwbHkgYXMgbWlkZGxld2FyZS5cbiAqIE9yIHdlIGNhbiB1c2UgYG1pZGRsZXdhcmVNZXRob2RzYCB0byBkZWZpbmUgZnVuY3Rpb24gbmFtZXMgZm9yIG1pZGRsZXdhcmUgdGFyZ2V0IHdpdGhpbiBhIGNsYXNzLlxuICpcbiAqIGNsYXNzIFBlcnNvbk1pZGRsZXdhcmUge1xuICogICBjb25zdHJ1Y3RvcigpIHtcbiAqICAgICAvLyBPciBEZWZpbmUgZnVuY3Rpb24gbmFtZXMgZm9yIG1pZGRsZXdhcmUgdGFyZ2V0LlxuICogICAgIHRoaXMubWlkZGxld2FyZU1ldGhvZHMgPSBbJ3dhbGsnLCAnc3BlYWsnXTtcbiAqICAgfVxuICogICAvLyBGdW5jdGlvbidzIG5hbWUgc3RhcnQgb3IgZW5kIHdpdGggXCJfXCIgd2lsbCBub3QgYmUgYWJsZSB0byBhcHBseSBhcyBtaWRkbGV3YXJlLlxuICogICBfZ2V0UHJlZml4KCkge1xuICogICAgIHJldHVybiAnTWlkZGxld2FyZSBsb2c6ICc7XG4gKiAgIH1cbiAqICAgbG9nKHRleHQpIHtcbiAqICAgICBjb25zb2xlLmxvZyh0aGlzLl9nZXRQcmVmaXgoKSArIHRleHQpO1xuICogICB9XG4gKiAgIHdhbGsodGFyZ2V0KSB7XG4gKiAgICAgcmV0dXJuIG5leHQgPT4gc3RlcCA9PiB7XG4gKiAgICAgICB0aGlzLmxvZyhgd2FsayBzdGFydCwgc3RlcHM6IHN0ZXAuYCk7XG4gKiAgICAgICBjb25zdCByZXN1bHQgPSBuZXh0KHN0ZXApO1xuICogICAgICAgdGhpcy5sb2coYHdhbGsgZW5kLmApO1xuICogICAgICAgcmV0dXJuIHJlc3VsdDtcbiAqICAgICB9XG4gKiAgIH1cbiAqICAgc3BlYWsodGFyZ2V0KSB7XG4gKiAgICAgcmV0dXJuIG5leHQgPT4gd29yZCA9PiB7XG4gKiAgICAgICB0aGlzLmxvZygndGhpcyBpcyBhIG1pZGRsZXdhcmUgdHJ5aW5nIHRvIHNheTogJyArIHdvcmQpO1xuICogICAgICAgcmV0dXJuIG5leHQod29yZCk7XG4gKiAgICAgfVxuICogICB9XG4gKiB9XG4gKlxuICogLy8gYXBwbHkgbWlkZGxld2FyZSB0byB0YXJnZXQgb2JqZWN0XG4gKiBjb25zdCBwID0gbmV3IFBlcnNvbigpO1xuICogY29uc3QgbWlkZGxld2FyZU1hbmFnZXIgPSBuZXcgTWlkZGxld2FyZU1hbmFnZXIocCk7XG4gKiBtaWRkbGV3YXJlTWFuYWdlci51c2UobmV3IFBlcnNvbk1pZGRsZXdhcmUoKSlcbiAqIHAud2FsaygzKTtcbiAqIHAuc3BlYWsoJ2hpJyk7XG4gKlxuICovXG5leHBvcnQgY2xhc3MgTWlkZGxld2FyZU1hbmFnZXIge1xuICAvKipcbiAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdC5cbiAgICogQHBhcmFtIHsuLi5vYmplY3R9IG1pZGRsZXdhcmVPYmplY3RzIE1pZGRsZXdhcmUgb2JqZWN0cy5cbiAgICogQHJldHVybiB7b2JqZWN0fSB0aGlzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih0YXJnZXQsIC4uLm1pZGRsZXdhcmVPYmplY3RzKSB7XG4gICAgbGV0IGluc3RhbmNlID0gbWlkZGxld2FyZU1hbmFnZXJIYXNoLmZpbmQoZnVuY3Rpb24gKGtleSkge1xuICAgICAgcmV0dXJuIGtleS5fdGFyZ2V0ID09PSB0YXJnZXQ7XG4gICAgfSk7XG4gICAgLy8gYSB0YXJnZXQgY2FuIG9ubHkgaGFzIG9uZSBNaWRkbGV3YXJlTWFuYWdlciBpbnN0YW5jZVxuICAgIGlmIChpbnN0YW5jZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLl9tZXRob2RzID0ge307XG4gICAgICB0aGlzLl9tZXRob2RNaWRkbGV3YXJlcyA9IHt9O1xuICAgICAgbWlkZGxld2FyZU1hbmFnZXJIYXNoLnB1c2godGhpcyk7XG4gICAgICBpbnN0YW5jZSA9IHRoaXM7XG4gICAgfVxuICAgIGluc3RhbmNlLnVzZSguLi5taWRkbGV3YXJlT2JqZWN0cyk7XG5cbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cblxuICAvLyBGdW5jdGlvbidzIG5hbWUgc3RhcnQgb3IgZW5kIHdpdGggXCJfXCIgd2lsbCBub3QgYmUgYWJsZSB0byBhcHBseSBtaWRkbGV3YXJlLlxuICBfbWV0aG9kSXNWYWxpZChtZXRob2ROYW1lKSB7XG4gICAgcmV0dXJuICEvXl8rfF8rJHxjb25zdHJ1Y3Rvci9nLnRlc3QobWV0aG9kTmFtZSk7XG4gIH1cblxuICAvLyBBcHBseSBtaWRkbGV3YXJlIHRvIG1ldGhvZFxuICBfYXBwbHlUb01ldGhvZChtZXRob2ROYW1lLCAuLi5taWRkbGV3YXJlcykge1xuICAgIGlmICh0eXBlb2YgbWV0aG9kTmFtZSA9PT0gJ3N0cmluZycgJiYgdGhpcy5fbWV0aG9kSXNWYWxpZChtZXRob2ROYW1lKSkge1xuICAgICAgbGV0IG1ldGhvZCA9IHRoaXMuX21ldGhvZHNbbWV0aG9kTmFtZV0gfHwgdGhpcy5fdGFyZ2V0W21ldGhvZE5hbWVdO1xuICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhpcy5fbWV0aG9kc1ttZXRob2ROYW1lXSA9IG1ldGhvZDtcbiAgICAgICAgaWYgKHRoaXMuX21ldGhvZE1pZGRsZXdhcmVzW21ldGhvZE5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICB0aGlzLl9tZXRob2RNaWRkbGV3YXJlc1ttZXRob2ROYW1lXSA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIG1pZGRsZXdhcmVzLmZvckVhY2gobWlkZGxld2FyZSA9PlxuICAgICAgICAgIHR5cGVvZiBtaWRkbGV3YXJlID09PSAnZnVuY3Rpb24nICYmIHRoaXMuX21ldGhvZE1pZGRsZXdhcmVzW21ldGhvZE5hbWVdLnB1c2gobWlkZGxld2FyZSh0aGlzLl90YXJnZXQpKVxuICAgICAgICApO1xuICAgICAgICB0aGlzLl90YXJnZXRbbWV0aG9kTmFtZV0gPSBjb21wb3NlKC4uLnRoaXMuX21ldGhvZE1pZGRsZXdhcmVzW21ldGhvZE5hbWVdKShtZXRob2QuYmluZCh0aGlzLl90YXJnZXQpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgKHJlZ2lzdGVyKSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0byB0aGUgdGFyZ2V0IGZ1bmN0aW9uIG9yIGFwcGx5IChyZWdpc3RlcikgbWlkZGxld2FyZSBvYmplY3RzLlxuICAgKiBJZiB0aGUgZmlyc3QgYXJndW1lbnQgaXMgYSBtaWRkbGV3YXJlIG9iamVjdCwgdGhlIHJlc3QgYXJndW1lbnRzIG11c3QgYmUgbWlkZGxld2FyZSBvYmplY3RzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IG1ldGhvZE5hbWUgU3RyaW5nIGZvciB0YXJnZXQgZnVuY3Rpb24gbmFtZSwgb2JqZWN0IGZvciBhIG1pZGRsZXdhcmUgb2JqZWN0LlxuICAgKiBAcGFyYW0gey4uLmZ1bmN0aW9ufC4uLm9iamVjdH0gbWlkZGxld2FyZXMgVGhlIG1pZGRsZXdhcmUgY2hhaW4gdG8gYmUgYXBwbGllZC5cbiAgICogQHJldHVybiB7b2JqZWN0fSB0aGlzXG4gICAqL1xuICB1c2UobWV0aG9kTmFtZSwgLi4ubWlkZGxld2FyZXMpIHtcbiAgICBpZiAodHlwZW9mIG1ldGhvZE5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmZvckVhY2goYXJnID0+IHtcbiAgICAgICAgLy8gQSBtaWRkbGV3YXJlIG9iamVjdCBjYW4gc3BlY2lmeSB0YXJnZXQgZnVuY3Rpb25zIHdpdGhpbiBtaWRkbGV3YXJlTWV0aG9kcyAoQXJyYXkpLlxuICAgICAgICAvLyBlLmcuIG9iai5taWRkbGV3YXJlTWV0aG9kcyA9IFsnbWV0aG9kMScsICdtZXRob2QyJ107XG4gICAgICAgIC8vIG9ubHkgbWV0aG9kMSBhbmQgbWV0aG9kMiB3aWxsIGJlIHRoZSB0YXJnZXQgZnVuY3Rpb24uXG4gICAgICAgIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmXG4gICAgICAgIChhcmcubWlkZGxld2FyZU1ldGhvZHMgfHxcbiAgICAgICAgKE9iamVjdC5rZXlzKGFyZykubGVuZ3RoID8gT2JqZWN0LmtleXMoYXJnKSA6IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE9iamVjdC5nZXRQcm90b3R5cGVPZihhcmcpKSlcbiAgICAgICAgKS5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgICAgdHlwZW9mIGFyZ1trZXldID09PSAnZnVuY3Rpb24nICYmIHRoaXMuX21ldGhvZElzVmFsaWQoa2V5KSAmJiB0aGlzLl9hcHBseVRvTWV0aG9kKGtleSwgYXJnW2tleV0uYmluZChhcmcpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYXBwbHlUb01ldGhvZChtZXRob2ROYW1lLCAuLi5taWRkbGV3YXJlcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHdpbmRvd1snTWlkZGxld2FyZU1hbmFnZXInXSA9IE1pZGRsZXdhcmVNYW5hZ2VyO1xufVxuIl19
