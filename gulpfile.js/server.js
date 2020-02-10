const gulp = require('gulp-help')(require('gulp'))
const browserSync = require('browser-sync').create()

const { rebuild } = require('./rebuild')

const { series, watch } = gulp

// ensures the `rebuild` task is complete before
// reloading browsers
function reload(cb) {
  browserSync.reload()
  cb()
}

function server() {
  browserSync.init({
    open: false,
    notify: false,
    cors: true,
    reloadDelay: 2000,
    ghostMode: false,
    logPrefix: 'Debug Server',
    proxy: 'localhost',
    serveStatic: ['./']
  })

  watch(['lib/**/*.js', './README.md'], series(rebuild, reload))
}
server.description = 'Starts a HTTP server for debug.'
exports.server = server
