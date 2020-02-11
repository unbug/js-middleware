const gulp = require('gulp-help')(require('gulp'))
const eslint = require('gulp-eslint')

const { src } = gulp

function lint() {
  return src(['gulpfile.js', 'gulp-tasks/**/*.js', 'lib/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
}
lint.description = 'Lint JS files.'

exports.lint = lint
