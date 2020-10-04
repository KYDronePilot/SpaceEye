const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const destPath = path.join(__dirname, 'dist', 'legal_notices.txt')

childProcess.execFile('yarn', ['licenses', 'generate-disclaimer'], (err, stdout, stderr) => {
    fs.writeFile(destPath, stdout, () => null)
})
