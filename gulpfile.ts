/* eslint-disable jsdoc/require-returns */
import { ChildProcess, exec, spawn, SpawnOptions } from 'child_process'
import fkill from 'fkill'
import fs from 'fs'
import fse from 'fs-extra'
import { parallel, series } from 'gulp'
import path from 'path'
import { promisify } from 'util'

const asyncExec = promisify(exec)
const asyncWriteFile = promisify(fs.writeFile)

const BUILD_DIR = path.join(__dirname, 'build')
const APPX_ASSETS = path.join(BUILD_DIR, 'appx')
const SPACE_EYE_ICONS = path.join(
    __dirname,
    'node_modules',
    'space-eye-icons',
    'dist'
)
const NODE_MODULES_BIN = path.join(__dirname, 'node_modules', '.bin')
const EXTENDED_PATH = NODE_MODULES_BIN + path.delimiter + (process.env.PATH ?? '')
const DIST = path.join(__dirname, 'dist')
const RELEASE = path.join(__dirname, 'release')
const MAIN_DIST = path.join(DIST, 'main.js')
const LEGAL_NOTICES = path.join(DIST, 'legal_notices.txt')

const defaultSpawnOptions: SpawnOptions = {
    env: {
        PATH: EXTENDED_PATH
    },
    stdio: 'inherit',
    shell: true
}
const prodSpawnOptions: SpawnOptions = {
    ...defaultSpawnOptions,
    env: {
        ...defaultSpawnOptions.env,
        NODE_ENV: 'production'
    }
}

/**
 * Run Webpack with a config.
 *
 * @param config - Path to config to use
 * @param production - Whether the node environment should be production
 */
function runWebpack(config: string, production = false): ChildProcess {
    const options = production ? prodSpawnOptions : defaultSpawnOptions
    return spawn('webpack', ['--config', config], options)
}

/**
 * Build the main process code.
 */
function buildMain(): ChildProcess {
    return runWebpack('webpack.main.prod.config.js', true)
}

/**
 * Build the renderer process code.
 */
function buildRenderer(): ChildProcess {
    return runWebpack('webpack.renderer.prod.config.js', true)
}

/**
 * Generate the application license report from used packages.
 */
async function generateLicenseReport() {
    const res = await asyncExec('yarn --silent licenses generate-disclaimer', {
        maxBuffer: 1024 * 50000
    })
    await asyncWriteFile(LEGAL_NOTICES, res.stdout)
}

/**
 * Copy icon asset files to the build dir for electron builder to access.
 */
async function copyIconAssets() {
    // Delete old appx assets if they exist, then copy the new
    await fse.remove(APPX_ASSETS)
    await fse.copy(path.join(SPACE_EYE_ICONS, 'appx'), APPX_ASSETS)
}

/**
 * Build for distribution with electron-builder.
 */
function buildDist() {
    // If on Windows, clear out the old release dir (causes lock problems otherwise)
    if (process.platform === 'win32') {
        fse.emptyDir(RELEASE)
    }
    return spawn('electron-builder', defaultSpawnOptions)
}

/**
 * Build main process code in dev mode.
 */
function buildMainDev(): ChildProcess {
    return runWebpack('webpack.main.config.js')
}

/**
 * Start running electron in dev mode.
 */
function startElectronDev(): ChildProcess {
    return spawn('electron', [`"${MAIN_DIST}"`], defaultSpawnOptions)
}

/**
 * Start the renderer process webpack dev server.
 */
function startRendererDevServer(): ChildProcess {
    return spawn(
        'webpack-dev-server',
        ['--config', 'webpack.renderer.dev.config.js'],
        defaultSpawnOptions
    )
}

/**
 * Start live dev mode.
 *
 * @param done - Signal task is done
 */
function startDev(done: (error?: any) => void) {
    // Start building main and start the renderer dev server
    const rendererDevServer = startRendererDevServer()
    const mainBuilder = buildMainDev()

    // Wait until main finishes building
    mainBuilder.on('close', code => {
        // Stop the dev server and exit if main build didn't exit cleanly
        if (code !== 0) {
            fkill(rendererDevServer.pid, { force: process.platform === 'win32' })
            done()
            return
        }
        // Else, start electron dev
        const electronDev = startElectronDev()
        // When stopped, stop the renderer dev server
        electronDev.on('close', () => {
            fkill(rendererDevServer.pid, { force: process.platform === 'win32' })
            done()
        })
    })
}

/**
 * Create the dist dir if it doesn't exist.
 */
async function ensureDist() {
    await fse.ensureDir(DIST)
}

export const build = parallel(buildMain, buildRenderer)

const buildCi = series(ensureDist, parallel(build, generateLicenseReport, copyIconAssets))
exports['build-ci'] = buildCi

exports['start-dev'] = startDev

exports.dist = series(buildCi, buildDist)
