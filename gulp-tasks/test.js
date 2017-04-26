var gulp = require('gulp-help')(require('gulp'));
var $ = require('gulp-load-plugins')();

gulp.task('test', 'Run test cases.', function () {
  return gulp.src(['test/**/*.spec.js'], {read: false})
    .pipe($.mocha({
      require: ['test/global/index.js'],
      compilers: 'js:babel-core/register'
    }))
});

