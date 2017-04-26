'use strict';

export default class Person {

  constructor() {
    this.step = 0;
    this.word = '';
  }

  walk(step) {
    this.step = step;
  }

  speak(word) {
    this.word = word;
  }
}
