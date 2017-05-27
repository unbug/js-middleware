'use strict';

export const PersonMiddleware1 = {
  walk: target => next => step => {
    step += 1;
    return next(step);
  },
  speak: target => next => word => {
    word = 'from middleware: ' + word;
    return next(word);
  }
};

export class PersonMiddleware2 {
  constructor() {
    // Define function names for middleware target.
    this.middlewareMethods = ['walk', 'speak'];
  }

  walk(target) {
    return next => step => {
      step += 1;
      return next(step);
    }
  }

  speak(target) {
    return next => word => {
      word = 'from middleware: ' + word;
      return next(word);
    }
  }
}

export class PersonMiddleware3 {
  // Prefix/Postfix method name by an underscore will ignore
  _getWord(word) {
    return 'from middleware: ' + word;
  }

  walk(target) {
    return next => step => {
      step += 1;
      return next(step);
    }
  }

  speak(target) {
    return next => word => {
      word = this._getWord();
      return next(word);
    }
  }
}
