/* eslint-disable jsdoc/require-returns */
import { ChildProcess, exec, spawn } from 'child_process'
import fs from 'fs'
import { parallel } from 'gulp'
import path from 'path'
import { promisify } from 'util'

const asyncExec = promisify(exec)
const asyncWriteFile = promisify(fs.writeFile)

const NODE_MODULES_BIN = path.join(__dirname, 'node_modules', '.bin')
const EXTENDED_PATH = NODE_MODULES_BIN + path.delimiter + (process.env.PATH ?? '')

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
function buildMain() {
    return runWebpack('webpack.main.prod.config.js')
}

/**
 * Build the renderer process code.
 */
function buildRenderer() {
    return runWebpack('webpack.renderer.prod.config.js')
}

/**
 * Build code.
 */
function build() {
    return parallel(buildMain, buildRenderer)
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

exports['build-ci'] = parallel(build(), generateLicenseReport)
