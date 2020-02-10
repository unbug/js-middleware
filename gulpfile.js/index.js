const { series } = require('gulp')

const { build, mini } = require('./build')
const { clean } = require('./clean')
const { docs } = require('./docs')
const { lint } = require('./lint')
const { server } = require('./server')
const { test } = require('./test')

exports.docs = docs
exports.test = test
exports.default = series(clean, lint, build, mini, docs, server)
