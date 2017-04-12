var gulp = require('gulp-help')(require('gulp'));
var $ = require('gulp-load-plugins')();

gulp.task('lint', 'Lint JS files', function () {
  return gulp.src(['gulpfile.js', 'gulp-tasks/**/*.js', 'lib/**/*.js'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});


