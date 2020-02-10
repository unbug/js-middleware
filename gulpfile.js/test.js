const gulp = require('gulp-help')(require('gulp'))
const mocha = require('gulp-mocha')

const { src } = gulp

function test() {
  return src(['test/**/*.spec.js'], {read: false})
    .pipe(mocha({
      require: ['@babel/register', 'test/global/index.js']
    }))
}
test.description = 'Run test cases.'
exports.test = test
