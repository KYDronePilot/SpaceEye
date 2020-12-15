import Axios from 'axios'
import { spawn } from 'child_process'
import { app, ipcMain, powerMonitor, Rectangle, screen, systemPreferences } from 'electron'
import { ipcMain as ipc } from 'electron-better-ipc'
import electronLog from 'electron-log'
import { cloneDeep } from 'lodash'
import { menubar } from 'menubar'
import moment from 'moment'
import net from 'net'
import * as path from 'path'
import * as url from 'url'

import { RootSatelliteConfig } from '../shared/config_types'
import {
    DOWNLOAD_THUMBNAIL_CHANNEL,
    DownloadThumbnailIpcParams,
    DownloadThumbnailIpcResponse,
    GET_AUTO_UPDATE,
    GET_CURRENT_VIEW_CHANNEL,
    GET_FIRST_RUN,
    GET_SATELLITE_CONFIG_CHANNEL,
    GET_START_ON_LOGIN,
    GetAutoUpdateIpcResponse,
    GetCurrentViewIpcResponse,
    GetFirstRunIpcResponse,
    GetStartOnLoginIpcResponse,
    IpcParams,
    IpcRequest,
    OPEN_WINDOWS_ICON_SETTINGS,
    QUIT_APPLICATION_CHANNEL,
    SET_AUTO_UPDATE,
    SET_FIRST_RUN,
    SET_START_ON_LOGIN,
    SET_WALLPAPER_CHANNEL,
    SetAutoUpdateIpcParams,
    SetFirstRunIpcParams,
    SetStartOnLoginIpcParams,
    SetWallpaperIpcParams,
    VISIBILITY_CHANGE_ALERT_CHANNEL,
    VisibilityChangeAlertIpcParams
} from '../shared/IpcDefinitions'
import { AppConfigStore } from './app_config_store'
import { resolveDns } from './dns_handler'
import { SatelliteConfigStore } from './satellite_config_store'
import { Initiator } from './update_lock'
import { setWindowVisibility, startUpdateChecking } from './updater'
import { formatAxiosError } from './utils'
import { WallpaperManager } from './wallpaper_manager'

const HEARTBEAT_INTERVAL = 600000
let heartbeatHandle: number

// let win: BrowserWindow | null

const log = electronLog.scope('main')

Axios.defaults.adapter = require('axios/lib/adapters/http')

// Send HEAD requests to each DNS IP, using the IP first to respond
Axios.interceptors.request.use(async config => {
    const newConfig = cloneDeep(config)
    const requestUrl = new url.URL(config.url!)
    if (net.isIP(requestUrl.hostname)) {
        return config
    }
    const ip = await resolveDns(requestUrl, config.cancelToken)
    newConfig.headers = config.headers ?? {}
    newConfig.headers.Host = requestUrl.hostname
    requestUrl.hostname = ip
    newConfig.url = requestUrl.toString()
    return newConfig
})

startUpdateChecking()

/**
 * Heartbeat function which runs every `HEARTBEAT_INTERVAL` seconds to perform
 * any necessary tasks.
 */
async function heartbeat() {
    log.debug('Heartbeat triggered')
    if (powerMonitor.getSystemIdleState(100) === 'locked') {
        log.debug('Not updating from heartbeat because screen locked')
        return
    }
    await WallpaperManager.update(Initiator.heartbeatFunction)
}

const index = url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
})

// Initial window positioning (subject to change on Windows depending on taskbar location)
const windowPosition = process.platform === 'darwin' ? 'trayRight' : 'trayBottomRight'

// Use ICO file for Windows
const toolbarIconPath = path.join(
    __dirname,
    'icons',
    process.platform === 'win32' ? 'windows_toolbar.ico' : 'mac_toolbar.png'
)

const mb = menubar({
    index,
    icon: toolbarIconPath,
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
    windowPosition,
    preloadWindow: true
})

/**
 * Different locations of the Windows taskbar, with respective window positions.
 */
enum WindowsTaskbarPosition {
    Right = 'trayBottomRight',
    Left = 'trayBottomLeft',
    Top = 'trayCenter',
    Bottom = 'trayBottomCenter'
}

/**
 * Get the position of the Windows taskbar based on the tray bounds.
 *
 * @param trayBounds - Current bounds of menubar tray
 * @returns Position of taskbar
 */
function getWindowsTaskbarLocation(trayBounds: Rectangle): WindowsTaskbarPosition {
    if (trayBounds.y === 0) {
        return WindowsTaskbarPosition.Top
    }
    if (trayBounds.x < 50) {
        return WindowsTaskbarPosition.Left
    }
    const currentScreen = screen.getDisplayMatching(trayBounds)
    if (trayBounds.y + trayBounds.height === currentScreen.bounds.height) {
        return WindowsTaskbarPosition.Bottom
    }
    return WindowsTaskbarPosition.Right
}

// No multi-instance checking on MAS builds (causes app to close immediately)
if (!process.mas) {
    // Only let one instance be opened
    if (!app.requestSingleInstanceLock()) {
        app.quit()
    } else {
        // If another instance is opened (and then closed), focus on this one
        app.on('second-instance', () => {
            mb.showWindow()
            if (mb.window) {
                mb.window.focus()
            }
        })
    }
}

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
        setWindowVisibility(false)
    })

    mb.on('show', () => {
        visibilityChangeAlert(true)
        setWindowVisibility(true)

        // If on Windows, make sure window position matches toolbar location
        if (process.platform === 'win32') {
            const newPosition = getWindowsTaskbarLocation(mb.tray.getBounds())
            const currentPosition = mb.getOption('windowPosition')
            if (newPosition !== currentPosition) {
                mb.setOption('windowPosition', newPosition)
            }
        }
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

    // If first run, show user the window
    if (AppConfigStore.firstRun) {
        mb.showWindow()
        // If macOS, no onboarding, so first run must be reset here
        if (process.platform === 'darwin') {
            AppConfigStore.firstRun = false
        }
    }

    // Run an update on start
    WallpaperManager.update(Initiator.user)
})

/**
 * Configure whether the app should start on login.
 *
 * @param shouldStart - Whether the app should start on login
 */
function configureStartOnLogin(shouldStart: boolean) {
    const loginItemSettings = app.getLoginItemSettings()

    // If not set to what it should be, update it
    if (loginItemSettings.openAtLogin !== shouldStart) {
        app.setLoginItemSettings({ openAtLogin: shouldStart })
    }
}

// Default to not start on login
if (AppConfigStore.startOnLogin === undefined) {
    AppConfigStore.startOnLogin = false
}

// Ensure configured on startup
configureStartOnLogin(AppConfigStore.startOnLogin)

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

ipc.answerRenderer<void, RootSatelliteConfig | undefined>(
    GET_SATELLITE_CONFIG_CHANNEL,
    async () => {
        log.info('Get satellite config request received')
        const configStore = SatelliteConfigStore.Instance
        try {
            return await configStore.getConfig()
        } catch (error) {
            log.error('Failed to get new satellite config:', error)
            return undefined
        }
    }
)

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
        let webResponse
        try {
            webResponse = await Axios.get(params.params.url, { responseType: 'arraybuffer' })
        } catch (error) {
            log.error('Error while downloading thumbnail:', formatAxiosError(error))
            const response: DownloadThumbnailIpcResponse = {
                dataUrl: undefined
            }
            event.reply(params.responseChannel, response)
            return
        }
        const b64Image = Buffer.from(webResponse.data, 'binary').toString('base64')
        const contentType = webResponse.headers['content-type'] ?? 'image/jpeg'
        const response: DownloadThumbnailIpcResponse = {
            dataUrl: `data:${contentType};base64,${b64Image}`,
            expiration: moment(
                webResponse.headers.expires ?? moment.utc().add(10, 'minutes')
            ).valueOf()
        }
        event.reply(params.responseChannel, response)
    }
)

ipcMain.on(GET_START_ON_LOGIN, async (event, params: IpcRequest<IpcParams>) => {
    const response: GetStartOnLoginIpcResponse = {
        startOnLogin: AppConfigStore.startOnLogin
    }
    event.reply(params.responseChannel, response)
})

ipcMain.on(SET_START_ON_LOGIN, async (_, params: IpcRequest<SetStartOnLoginIpcParams>) => {
    AppConfigStore.startOnLogin = params.params.startOnLogin
    configureStartOnLogin(params.params.startOnLogin)
})

ipcMain.on(GET_FIRST_RUN, async (event, params: IpcRequest<IpcParams>) => {
    const response: GetFirstRunIpcResponse = {
        firstRun: AppConfigStore.firstRun
    }
    event.reply(params.responseChannel, response)
})

ipcMain.on(SET_FIRST_RUN, async (_, params: IpcRequest<SetFirstRunIpcParams>) => {
    AppConfigStore.firstRun = params.params.firstRun
})

ipcMain.on(GET_AUTO_UPDATE, async (event, params: IpcRequest<IpcParams>) => {
    const response: GetAutoUpdateIpcResponse = {
        autoUpdate: AppConfigStore.autoUpdate
    }
    event.reply(params.responseChannel, response)
})

ipcMain.on(SET_AUTO_UPDATE, async (_, params: IpcRequest<SetAutoUpdateIpcParams>) => {
    AppConfigStore.autoUpdate = params.params.autoUpdate
})

ipcMain.on(OPEN_WINDOWS_ICON_SETTINGS, () => {
    log.info('Opening Windows icon settings')
    // Special command that opens Windows notification area icon settings
    const command = spawn('cmd.exe', [
        '/c',
        'explorer shell:::{05d7b0f4-2121-4eff-bf6b-ed3f69b894d9}'
    ])

    command.stdout.on('data', data => {
        log.debug('Windows icon settings stdout:', data)
    })
    command.stderr.on('data', data => {
        log.error('Windows icon settings stderr:', data)
    })
    command.on('exit', code => {
        log.info('Windows icon settings cmd exited with:', code)
    })
})

if (process.platform === 'darwin') {
    systemPreferences.subscribeWorkspaceNotification(
        'NSWorkspaceActiveSpaceDidChangeNotification',
        async () => {
            log.debug('macOS active space changed')
            await WallpaperManager.update(Initiator.displayChangeWatcher)
        }
    )
}
