/* eslint-disable jsdoc/require-returns */
import { ChildProcess, exec, spawn } from 'child_process'
import fs from 'fs'
import { parallel, series } from 'gulp'
import path from 'path'
import { promisify } from 'util'

const asyncExec = promisify(exec)
const asyncWriteFile = promisify(fs.writeFile)

const NODE_MODULES_BIN = path.join(__dirname, 'node_modules', '.bin')
const EXTENDED_PATH = NODE_MODULES_BIN + path.delimiter + (process.env.PATH ?? '')
const MAIN_DIST = path.join(__dirname, 'dist', 'main.js')

/**
 * Run Webpack with a config.
 *
 * @param config - Path to config to use
 */
function runWebpack(config: string): ChildProcess {
    return spawn('webpack', ['--config', config], {
        env: {
            NODE_ENV: 'production',
            PATH: EXTENDED_PATH
        },
        stdio: 'inherit'
    })
}

/**
 * Build the main process code.
 */
function buildMain(): ChildProcess {
    return runWebpack('webpack.main.prod.config.js')
}

/**
 * Build the renderer process code.
 */
function buildRenderer(): ChildProcess {
    return runWebpack('webpack.renderer.prod.config.js')
}

/**
 * Generate the application license report from used packages.
 */
async function generateLicenseReport() {
    const destPath = path.join(__dirname, 'dist', 'legal_notices.txt')
    const yarnCmd = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'

    const res = await asyncExec(`${yarnCmd} --silent licenses generate-disclaimer`, {
        maxBuffer: 1024 * 50000
    })
    await asyncWriteFile(destPath, res.toString())
}

/**
 * Run the electron builder command.
 */
function runElectronBuilder() {
    return spawn('electron-builder', { env: { PATH: EXTENDED_PATH }, stdio: 'inherit' })
}

/**
 * Build main process code in dev mode.
 */
function buildMainDev(): ChildProcess {
    return spawn('webpack', ['--config', 'webpack.main.config.js'], {
        env: {
            PATH: EXTENDED_PATH
        },
        stdio: 'inherit'
    })
}

/**
 * Start running electron in dev mode.
 */
function startElectronDev(): ChildProcess {
    return spawn('electron', [MAIN_DIST], { env: { PATH: EXTENDED_PATH } })
}

/**
 * Start the renderer process webpack dev server.
 */
function startRendererDevServer(): ChildProcess {
    return spawn('webpack-dev-server', ['--config', 'webpack.renderer.dev.config.js'], {
        env: { PATH: EXTENDED_PATH }
    })
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
            rendererDevServer.kill('SIGINT')
            done()
            return
        }
        // Else, start electron dev
        const electronDev = startElectronDev()
        // When stopped, stop the renderer dev server
        electronDev.on('close', () => {
            rendererDevServer.kill('SIGINT')
            done()
        })
    })
}

export const build = parallel(buildMain, buildRenderer)

const buildCi = parallel(build, generateLicenseReport)
exports['build-ci'] = buildCi

exports['start-dev'] = startDev

exports.dist = series(buildCi, runElectronBuilder)
