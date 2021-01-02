const { execSync } = require('child_process')
const path = require('path')

/**
 * Serves as a hook for electron-builder after the appx manifest file is created.
 *
 * @param {string} manifest - Path to the manifest file
 */
exports.appxManifestCreated = function(manifest) {
    // Path to Gulp executable
    const gulpPath = path.normalize(path.join(__dirname, '..', 'node_modules', '.bin', 'gulp.cmd'))
    // Call Gulp task
    execSync(`"${gulpPath}" appxManifestCreated --file "${manifest}"`)
}
