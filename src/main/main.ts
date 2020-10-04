import Axios from 'axios'
import { app, ipcMain, powerMonitor, screen, systemPreferences } from 'electron'
import electronLog from 'electron-log'
import { menubar } from 'menubar'
import * as path from 'path'
import * as url from 'url'

import {
    DOWNLOAD_THUMBNAIL_CHANNEL,
    DownloadThumbnailIpcParams,
    DownloadThumbnailIpcResponse,
    GET_CURRENT_VIEW_CHANNEL,
    GET_SATELLITE_CONFIG_CHANNEL,
    GetCurrentViewIpcResponse,
    GetSatelliteConfigIpcResponse,
    IpcParams,
    IpcRequest,
    QUIT_APPLICATION_CHANNEL,
    SET_WALLPAPER_CHANNEL,
    SetWallpaperIpcParams,
    VISIBILITY_CHANGE_ALERT_CHANNEL,
    VisibilityChangeAlertIpcParams
} from '../shared/IpcDefinitions'
import { AppConfigStore } from './app_config_store'
import { SatelliteConfigStore } from './satellite_config_store'
import { Initiator } from './update_lock'
import { startUpdateChecking } from './updater'
import { WallpaperManager } from './wallpaper_manager'

const HEARTBEAT_INTERVAL = 600000
let heartbeatHandle: number

// let win: BrowserWindow | null

const log = electronLog.scope('main')

Axios.defaults.adapter = require('axios/lib/adapters/http')

startUpdateChecking()

/**
 * Heartbeat function which runs every `HEARTBEAT_INTERVAL` seconds to perform
 * any necessary tasks.
 */
async function heartbeat() {
    log.debug('Heartbeat triggered')
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
        backgroundColor: '#222222',
        resizable: false,
        movable: false
    },
    windowPosition
})

/**
 * Alert the renderer that the window visibility has changed.
 *
 * @param visible Whether the window became visible or not visible
 */
function visibilityChangeAlert(visible: boolean) {
    const params: VisibilityChangeAlertIpcParams = {
        visible
    }

    mb.window!.webContents.send(VISIBILITY_CHANGE_ALERT_CHANNEL, params)
}

mb.on('after-create-window', () => {
    log.info('App window created')
    log.info('Production mode:', process.env.NODE_ENV === 'production')

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

    mb.on('hide', () => {
        visibilityChangeAlert(false)
    })

    mb.on('show', () => {
        visibilityChangeAlert(true)
    })
})

// mb.on('ready', () => {})

mb.on('ready', () => {
    log.info('Menubar ready')
    // createWindow()
    heartbeatHandle = setInterval(heartbeat, HEARTBEAT_INTERVAL)

    // Display config change triggers update
    screen.on('display-added', async () => {
        log.debug('Display added')
        await WallpaperManager.update(Initiator.displayChangeWatcher)
    })

    screen.on('display-removed', async () => {
        log.debug('Display removed')
        await WallpaperManager.update(Initiator.displayChangeWatcher)
    })

    screen.on('display-metrics-changed', async () => {
        log.debug('Display metrics changed')
        await WallpaperManager.update(Initiator.displayChangeWatcher)
    })

    // Update when machine is unlocked/resumed
    // TODO: Need a new initiator
    if (process.platform === 'darwin' || process.platform === 'win32') {
        powerMonitor.on('unlock-screen', async () => {
            log.debug('Screen unlocked')
            await WallpaperManager.update(Initiator.displayChangeWatcher)
        })
    }

    if (process.platform === 'linux' || process.platform === 'win32') {
        powerMonitor.on('resume', async () => {
            log.debug('System resumed')
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
    log.info('Application will quit')
    clearInterval(heartbeatHandle)
})

app.on('window-all-closed', () => {
    log.info('All windows have been closed')
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on(QUIT_APPLICATION_CHANNEL, () => {
    log.info('Quit request received')
    app.quit()
})

ipcMain.on(GET_SATELLITE_CONFIG_CHANNEL, async (event, params: IpcRequest<IpcParams>) => {
    log.info('Get satellite config request received')
    const configStore = SatelliteConfigStore.Instance
    try {
        const response: GetSatelliteConfigIpcResponse = {
            config: await configStore.getConfig()
        }
        event.reply(params.responseChannel, response)
    } catch (error) {
        log.error('Failed to get new satellite config:', error)
        const response: GetSatelliteConfigIpcResponse = {
            config: undefined
        }
        event.reply(params.responseChannel, response)
    }
})

ipcMain.on(SET_WALLPAPER_CHANNEL, async (event, params: IpcRequest<SetWallpaperIpcParams>) => {
    log.info('Wallpaper set request received for view:', params.params.viewId)
    AppConfigStore.currentViewId = params.params.viewId
    await WallpaperManager.update(Initiator.user)
    event.reply(params.responseChannel, {})
})

ipcMain.on(GET_CURRENT_VIEW_CHANNEL, async (event, params: IpcRequest<IpcParams>) => {
    log.info('Current view request received')
    const response: GetCurrentViewIpcResponse = {
        viewId: AppConfigStore.currentViewId
    }
    event.reply(params.responseChannel, response)
})

ipcMain.on(
    DOWNLOAD_THUMBNAIL_CHANNEL,
    async (event, params: IpcRequest<DownloadThumbnailIpcParams>) => {
        log.info('Download thumbnail request received')
        const webResponse = await Axios.get(params.params.url, { responseType: 'arraybuffer' })
        const b64Image = Buffer.from(webResponse.data, 'binary').toString('base64')
        const response: DownloadThumbnailIpcResponse = {
            dataUrl: `data:image/jpeg;base64,${b64Image}`
        }
        event.reply(params.responseChannel, response)
    }
)

if (process.platform === 'darwin') {
    systemPreferences.subscribeWorkspaceNotification(
        'NSWorkspaceActiveSpaceDidChangeNotification',
        async () => {
            log.debug('macOS active space changed')
            await WallpaperManager.update(Initiator.displayChangeWatcher)
        }
    )
}
