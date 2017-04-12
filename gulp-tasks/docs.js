var gulp = require('gulp-help')(require('gulp'));
var $ = require('gulp-load-plugins')();
var fs = require('fs-then-native');
var jsdoc2md = require('jsdoc-to-markdown');
var runSequence = require('run-sequence');

var config = require('../docs/jsdoc.conf.json');
gulp.task('docs:html', 'Builds HTML documentation', function (cb) {
  gulp.src(['README.md', './lib/**/*.js', '!./lib/index.js'], {read: false})
    .pipe($.jsdoc3(config, cb));
});

gulp.task('docs:md', 'Builds markdown documentation', function () {
  return jsdoc2md.render({files: ['./lib/**/*.js']})
    .then(function (output) {
      fs.writeFile('docs/API.md', output)
    });
});

gulp.task('docs', 'Builds documentation', function (cb) {
  runSequence('docs:md', 'docs:html', cb);
});
