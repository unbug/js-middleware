var gulp = require('gulp-help')(require('gulp'));
var del = require('del');
var runSequence = require('run-sequence');

gulp.task('clean:dist', 'Cleans dist files.', function () {
  return del(['./dist/**'], {force: true});
});

gulp.task('clean:docs', 'Cleans docs files.', function () {
  return del(['./docs/html/**', './docs/*.md'], {force: true});
});

gulp.task('clean', 'Cleans files.', function (cb) {
  runSequence('clean:dist', 'clean:docs', cb);
});
