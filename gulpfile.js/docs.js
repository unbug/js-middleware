const gulp = require('gulp-help')(require('gulp'))
const jsdoc = require('gulp-jsdoc3')
const fs = require('fs-then-native');
const jsdoc2md = require('jsdoc-to-markdown')

const config = require('../docs/jsdoc.conf.json');

const { series, src } = gulp

function docsHtml(cb) {
  src(['README.md', './lib/**/*.js', '!./lib/index.js'], {read: false})
    .pipe(jsdoc(config, cb));
}
docsHtml.description = 'Builds HTML documentation.'

function docsMd() {
  return jsdoc2md.render({files: ['./lib/**/*.js']})
    .then(function (output) {
      return fs.writeFile('docs/API.md', output)
    })
}
docsMd.description = 'Builds markdown documentation.'

const docs = series(docsMd, docsHtml)
docs.description = 'Builds documentation.'
exports.docs = docs
