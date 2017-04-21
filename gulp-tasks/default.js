var gulp = require('gulp-help')(require('gulp'));
var $ = require('gulp-load-plugins')();
var runSequence = require('run-sequence');

function watch() {
  return gulp.watch(['lib/**/*.js', './README.md'], function (event) {
    $.util.log($.util.colors.bold('File ' + event.path + ' was ' + event.type + ', running tasks...'));
    runSequence('lint', 'build', 'docs');
  });
}

gulp.task('watch', 'Watches for changes in files, re-lint, re-build & re-docs', watch);
