import Axios from 'axios'
import { DesktopWallpaper } from 'earth_from_space_live_mac_node_api'
// import { IDesktopWallpaper } from 'earth_from_space_live_windows_node_api'
import { app, BrowserWindow, ipcMain, screen, systemPreferences } from 'electron'
import * as path from 'path'
import * as url from 'url'

import {
    CLOSE_APPLICATION_CHANNEL,
    CloseApplicationIpcParams,
    EXAMPLE_CHANNEL,
    ExampleIpcParams,
    IpcRequest
} from '../shared/IpcDefinitions'

const HEARTBEAT_INTERVAL = 2000
let heartbeatHandle: number

let win: BrowserWindow | null

const installExtensions = async () => {
    const installer = require('electron-devtools-installer')
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS']

    return Promise.all(
        extensions.map(name => installer.default(installer[name], forceDownload))
    ).catch(console.log) // eslint-disable-line no-console
}

const createWindow = async () => {
    if (process.env.NODE_ENV !== 'production') {
        await installExtensions()
    }

    win = new BrowserWindow({
        width: 800,
        height: 600,
        darkTheme: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        backgroundColor: '#222222'
    })
    if (process.platform === 'darwin') {
        win.setWindowButtonVisibility(false)
    }

    if (process.env.NODE_ENV !== 'production') {
        process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1' // eslint-disable-line require-atomic-updates
        win.loadURL(`http://localhost:2003`)
    } else {
        win.loadURL(
            url.format({
                pathname: path.join(__dirname, 'index.html'),
                protocol: 'file:',
                slashes: true
            })
        )
    }

    if (process.env.NODE_ENV !== 'production') {
        // Open DevTools, see https://github.com/electron/electron/issues/12438 for why we wait for dom-ready
        win.webContents.once('dom-ready', () => {
            win!.webContents.openDevTools({ mode: 'detach' })
        })
    }

    win.on('closed', () => {
        win = null
    })
}

/**
 * Heartbeat function which runs every `HEARTBEAT_INTERVAL` seconds to perform
 * any necessary tasks.
 */
function heartbeat() {
    console.log('Lub dub')
}

app.on('ready', () => {
    createWindow()
    heartbeatHandle = setInterval(heartbeat, HEARTBEAT_INTERVAL)
})

app.on('will-quit', () => {
    clearInterval(heartbeatHandle)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

ipcMain.on(CLOSE_APPLICATION_CHANNEL, () => {
    if (win !== undefined) {
        win!.close()
    }
})
