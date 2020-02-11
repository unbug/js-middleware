const gulp = require('gulp-help')(require('gulp'))
const babelify = require('babelify')
const bundleCollapser = require('bundle-collapser/plugin')
const browserify = require('browserify')
const rename = require('gulp-rename')
const size = require('gulp-size')
const uglify = require('gulp-uglify')
const source = require('vinyl-source-stream')
const configs = require('../package.json')

const { dest } = gulp

function build() {
  return browserify({
    entries: './lib/Middleware.js',
    paths: ['./lib'],
    standalone: configs.name
  }).transform(babelify) // transform to babel
    .plugin(bundleCollapser) // convert bundle paths to IDS to save bytes in browserify bundles
    .bundle()
    .pipe(source('middleware.js'))
    .pipe(dest('dist')) // for npm distribution
}
build.description = 'Builds the library.'
exports.build = build

function mini() {
  return gulp.src('./dist/middleware.js')
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(dest('./dist'))
    .pipe(size({title: 'min'}));
}
mini.description = 'Minify the library.'
exports.mini = mini
