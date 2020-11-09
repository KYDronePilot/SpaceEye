const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const destPath = path.join(__dirname, 'dist', 'legal_notices.txt')
const yarnCmd = process.platform === 'win32' ? 'yarn.cmd' : 'yarn'

const res = execFileSync(yarnCmd, ['--silent', 'licenses', 'generate-disclaimer'], {
    maxBuffer: 1024 * 50000
})
fs.writeFileSync(destPath, res.toString())
