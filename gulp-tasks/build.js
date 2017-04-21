var gulp = require('gulp-help')(require('gulp'));
var $ = require('gulp-load-plugins')();
var browserify = require('browserify');
var babelify = require('babelify');
var bundleCollapser = require('bundle-collapser/plugin');
var derequire = require('derequire');
var source = require('vinyl-source-stream');
var map = require('vinyl-map');
var buffer = require('vinyl-buffer');
var configs = require('../package.json');

gulp.task('build', 'Builds the library', function (cb) {
  var production = $.util.env.type === 'production';
  var b = browserify({
    debug: !production,
    entries: './lib/Middleware.js',
    paths: ['./lib'],
    standalone: configs.name
  });

  // transform to babel
  b.transform(babelify);

  // convert bundle paths to IDS to save bytes in browserify bundles
  b.plugin(bundleCollapser);

  b.bundle()
    .on('error', function (err) {
      $.util.log($.util.colors.bold('Build Failed!'));
      cb(err);
    })
    .pipe(source('middleware.js'))
    .pipe(map(function (code) {
      return derequire(code);
    }))
    .pipe(buffer())
    .pipe(gulp.dest('dist')) // for npm distribution
    .on('end', function () {
      cb();
    });
});

gulp.task('mini', 'Minify the library', function () {
  return gulp.src('./dist/middleware.js')
    .pipe($.uglify())
    .pipe($.rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist'))
    .pipe($.size({title: 'min'}));
});
