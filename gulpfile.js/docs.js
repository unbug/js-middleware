const gulp = require('gulp-help')(require('gulp'))
const jsdoc = require('gulp-jsdoc3')
const fs = require('fs')
const jsdoc2md = require('jsdoc-to-markdown')

const config = require('../docs/jsdoc.conf.json');

const { series, src } = gulp

function docsHtml(cb) {
  src(['README.md', './lib/**/*.js', '!./lib/index.js'], {read: false})
    .pipe(jsdoc(config, cb));
}
docsHtml.description = 'Builds HTML documentation.'

function docsMd(cb) {
  jsdoc2md.render({
    files: ['./lib/**/*.js'],
    'example-lang': 'js'
  })
    .then(function (output) {
      fs.writeFileSync('docs/API.md', output)
      cb()
    })
}
docsMd.description = 'Builds markdown documentation.'

const docs = series(docsMd, docsHtml)
docs.description = 'Builds documentation.'
exports.docs = docs
