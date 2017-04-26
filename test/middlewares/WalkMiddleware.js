'use strict';
// a middleware function for walk function
const WalkMiddleware = target => next => step => {
  step += 1;
  return next(step);
}
export default WalkMiddleware;
