const gulp = require('gulp-help')(require('gulp'))

const { build, mini } = require('./build')
const { docs } = require('./docs')
const { lint } = require('./lint')

const { series } = gulp

const rebuild = series(lint, build, mini, docs)
rebuild.description = 're-lint, re-build & re-docs.'
exports.rebuild = rebuild
