import Axios from 'axios'
import { app, BrowserWindow, ipcMain, powerMonitor, screen, systemPreferences } from 'electron'
import { menubar } from 'menubar'
import * as path from 'path'
import * as url from 'url'

import {
    GET_SATELLITE_CONFIG_CHANNEL,
    GetSatelliteConfigIpcResponse,
    IpcParams,
    IpcRequest,
    QUIT_APPLICATION_CHANNEL,
    SET_WALLPAPER_CHANNEL,
    SetWallpaperIpcParams
} from '../shared/IpcDefinitions'
import { AppConfigStore } from './app_config_store'
import { SatelliteConfigStore } from './satellite_config_store'
import { Initiator } from './update_lock'
import { WallpaperManager } from './wallpaper_manager'

const HEARTBEAT_INTERVAL = 600000
let heartbeatHandle: number

// let win: BrowserWindow | null

Axios.defaults.adapter = require('axios/lib/adapters/http')

/**
 * Heartbeat function which runs every `HEARTBEAT_INTERVAL` seconds to perform
 * any necessary tasks.
 */
async function heartbeat() {
    await WallpaperManager.update(Initiator.heartbeatFunction)
}

const index = url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
})

const windowPosition = process.platform === 'darwin' ? 'trayRight' : 'trayBottomRight'

const mb = menubar({
    index,
    icon: path.join(__dirname, 'assets', 'IconTemplate.png'),
    browserWindow: {
        width: 550,
        height: 640,
        darkTheme: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        },
        backgroundColor: '#222222'
    },
    windowPosition
})

mb.on('after-create-window', () => {
    if (process.platform === 'darwin') {
        mb.window!.setWindowButtonVisibility(false)
    }

    if (process.env.NODE_ENV !== 'production') {
        process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1' // eslint-disable-line require-atomic-updates
        mb.window!.loadURL(`http://localhost:2003`)
    }

    if (process.env.NODE_ENV !== 'production') {
        // Open DevTools, see https://github.com/electron/electron/issues/12438 for why we wait for dom-ready
        mb.window!.webContents.once('dom-ready', () => {
            mb.window!.webContents.openDevTools({ mode: 'detach' })
        })
    }
})

// mb.on('ready', () => {})

mb.on('ready', () => {
    // createWindow()
    heartbeatHandle = setInterval(heartbeat, HEARTBEAT_INTERVAL)

    // Display config change triggers update
    screen.on('display-added', async () => {
        await WallpaperManager.update(Initiator.displayChangeWatcher)
    })

    screen.on('display-removed', async () => {
        await WallpaperManager.update(Initiator.displayChangeWatcher)
    })

    screen.on('display-metrics-changed', async () => {
        await WallpaperManager.update(Initiator.displayChangeWatcher)
    })

    // Update when machine is unlocked/resumed
    // TODO: Need a new initiator
    if (process.platform === 'darwin' || process.platform === 'win32') {
        powerMonitor.on('unlock-screen', async () => {
            await WallpaperManager.update(Initiator.displayChangeWatcher)
        })
    }

    if (process.platform === 'linux' || process.platform === 'win32') {
        powerMonitor.on('resume', async () => {
            await WallpaperManager.update(Initiator.displayChangeWatcher)
        })
    }
})

// Ensure app is configured to open on user login
const loginItemSettings = app.getLoginItemSettings()

if (!loginItemSettings.openAtLogin) {
    app.setLoginItemSettings({ openAtLogin: true })
}

app.on('will-quit', () => {
    clearInterval(heartbeatHandle)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on(QUIT_APPLICATION_CHANNEL, () => {
    app.quit()
})

ipcMain.on(GET_SATELLITE_CONFIG_CHANNEL, async (event, params: IpcRequest<IpcParams>) => {
    const configStore = SatelliteConfigStore.Instance
    try {
        const response: GetSatelliteConfigIpcResponse = {
            config: await configStore.getConfig()
        }
        event.reply(params.responseChannel, response)
    } catch (error) {
        const response: GetSatelliteConfigIpcResponse = {
            config: undefined
        }
        event.reply(params.responseChannel, response)
    }
})

ipcMain.on(SET_WALLPAPER_CHANNEL, async (event, params: IpcRequest<SetWallpaperIpcParams>) => {
    AppConfigStore.currentViewId = params.params.viewId
    await WallpaperManager.update(Initiator.user)
    event.reply(params.responseChannel, {})
})

if (process.platform === 'darwin') {
    systemPreferences.subscribeWorkspaceNotification(
        'NSWorkspaceActiveSpaceDidChangeNotification',
        async () => {
            await WallpaperManager.update(Initiator.displayChangeWatcher)
        }
    )
}
