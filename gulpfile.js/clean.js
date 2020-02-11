const gulp = require('gulp-help')(require('gulp'))
const del = require('del')

const { series } = gulp

function cleanDist(cb) {
  del(['./dist/**'], {force: true})
  cb()
}
cleanDist.description = 'Cleans dist files.'

function cleanDocs(cb) {
  del(['./docs/html/**', './docs/*.md'], {force: true})
  cb()
}
cleanDocs.description = 'Cleans docs files.'

const clean = series(cleanDist, cleanDocs)
clean.description = 'Cleans files.'

exports.clean = clean
