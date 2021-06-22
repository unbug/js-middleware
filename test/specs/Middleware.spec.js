'use strict';
import {MiddlewareManager} from '../../lib/Middleware';
import Person from '../person/Person';
import WalkMiddleware from '../middlewares/WalkMiddleware';
import {PersonMiddleware1, PersonMiddleware2, PersonMiddleware3} from '../middlewares/PersonMiddleware';

describe('Middleware: ', () => {
  let person;
  let middlewareManager;

  beforeEach(() => {
    person = new Person();
    middlewareManager = new MiddlewareManager(person);
  });

  afterEach(() => {
    person = null;
    middlewareManager = null;
  });

  describe('middleware function: ', () => {
    it('should apply the middlweare function', () => {
      middlewareManager.use('walk', WalkMiddleware);
      const newStep = 3;
      person.walk(newStep);
      return assert.equal(person.step, newStep + 1);
    });
  });

  describe('middleware object: ', () => {
    it('should apply the middlweare object', () => {
      middlewareManager.use(PersonMiddleware1);
      const step = person.step;
      const newStep = 3;
      person.walk(newStep);
      person.speak('hello');
      assert.equal(person.step, newStep + 1);
      assert.isTrue(/from middleware/g.test(person.word));
    });
  });

  describe('middlewareMethods: ', () => {
    it('should apply the middlweare object', () => {
      middlewareManager.use(new PersonMiddleware2());
      const newStep = 3;
      person.walk(newStep);
      person.speak('hello');
      assert.equal(person.step, newStep + 1);
      assert.isTrue(/from middleware/g.test(person.word));
    });
  });

  describe('middleware object with private method: ', () => {
    it('should apply the middlweare object', () => {
      middlewareManager.use(new PersonMiddleware3());
      const newStep = 3;
      person.walk(newStep);
      person.speak('hello');
      assert.equal(person.step, newStep + 1);
      assert.isTrue(/from middleware/g.test(person.word));
    });
  });

  describe('middleware all class methods: ', () => {
    it('should apply the middlweare function to all class methods', () => {
      middlewareManager.use(null, WalkMiddleware);
      const newStep = 3;
      person.walk(newStep);
      assert.equal(person.step, newStep + 1);
      person.speak('hello');
      return assert.equal(person.word, 'hello1');
    });
  });
});
