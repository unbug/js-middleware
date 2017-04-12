var gulp = require('gulp-help')(require('gulp'));
var browserSync = require('browser-sync').create();

gulp.task('server', 'Starts a HTTP server for debug.', function () {
  browserSync.init({
    open: false,
    notify: false,
    cors: true,
    reloadDelay: 2000,
    ghostMode: false,
    logPrefix: 'Debug Server',
    proxy: 'localhost',
    serveStatic: ['./']
  });

  gulp.watch(['./*.html'], browserSync.reload);
  gulp.watch(['./statics/**/*'], browserSync.reload);
  gulp.watch(['./dist/*.js'], browserSync.reload);
});
