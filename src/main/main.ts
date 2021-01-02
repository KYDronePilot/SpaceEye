import { StartupTaskState, WindowsStoreAutoLaunch } from '@kydronepilot/electron-winstore-auto-launch'
import Axios from 'axios'
import { spawn } from 'child_process'
import { app, powerMonitor, Rectangle, screen, systemPreferences } from 'electron'
import { ipcMain as ipc } from 'electron-better-ipc'
import electronLog from 'electron-log'
import { cloneDeep } from 'lodash'
import { menubar } from 'menubar'
import moment from 'moment'
import net from 'net'
import * as path from 'path'
import * as url from 'url'

import { DownloadedThumbnailIpc, DownloadThumbnailIpcRequest, toBoolean } from '../shared'
import { RootSatelliteConfig } from '../shared/config_types'
import {
    DOWNLOAD_THUMBNAIL_CHANNEL,
    GET_AUTO_UPDATE,
    GET_CURRENT_VIEW_CHANNEL,
    GET_FIRST_RUN,
    GET_SATELLITE_CONFIG_CHANNEL,
    GET_START_ON_LOGIN,
    GET_VIEW_DOWNLOAD_TIME,
    OPEN_WINDOWS_ICON_SETTINGS,
    QUIT_APPLICATION_CHANNEL,
    RELOAD_VIEW,
    SET_AUTO_UPDATE,
    SET_FIRST_RUN,
    SET_START_ON_LOGIN,
    SET_WALLPAPER_CHANNEL,
    VISIBILITY_CHANGE_ALERT_CHANNEL
} from '../shared/IpcDefinitions'
import { AppConfigStore } from './app_config_store'
import { BUILD_TYPE } from './consts'
import { resolveDns } from './dns_handler'
import { SatelliteConfigStore } from './satellite_config_store'
import { Initiator } from './update_lock'
import { setWindowVisibility, startUpdateChecking } from './updater'
import { formatAxiosError } from './utils'
import { latestViewDownloadTimes, WallpaperManager } from './wallpaper_manager'

const HEARTBEAT_INTERVAL = 60000
let heartbeatHandle: number

// let win: BrowserWindow | null

const log = electronLog.scope('main')

Axios.defaults.adapter = require('axios/lib/adapters/http')

Axios.defaults.headers['User-Agent'] = `SpaceEye/${APP_VERSION} (${BUILD_TYPE})`

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

const ICONS_DIR = path.join(__dirname, 'icons')
const MAC_TOOLBAR_ICON_PATH = path.join(ICONS_DIR, 'MacToolbarTemplate.png')
const WINDOWS_TOOLBAR_ICON_PATH = path.join(ICONS_DIR, 'windows_toolbar.ico')
const WINDOWS_TOOLBAR_LIGHT_ICON_PATH = path.join(ICONS_DIR, 'windows_toolbar_light.ico')

// Use ICO file for Windows
let toolbarIconPath =
    process.platform === 'win32' ? WINDOWS_TOOLBAR_ICON_PATH : MAC_TOOLBAR_ICON_PATH

/**
 * Set the toolbar icon to the path if not already set.
 *
 * @param newIconPath - Path to the new icon
 */
function setToolbarIcon(newIconPath: string) {
    if (toolbarIconPath !== newIconPath) {
        log.info('Updating toolbar icon path to:', newIconPath)
        toolbarIconPath = newIconPath
        mb.tray.setImage(toolbarIconPath)
    }
}

/**
 * If on Window, check the taskbar theme and update the taskbar icon accordingly.
 */
function updateToolbarIcon() {
    if (process.platform !== 'win32') {
        return
    }
    // Get the registry value for whether the taskbar is set to light theme
    const command = spawn('reg.exe', [
        'query',
        'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
        '/v',
        'SystemUsesLightTheme'
    ])
    let stdout = ''
    command.stdout.setEncoding('utf8')
    command.stderr.setEncoding('utf8')

    // Some debugging
    command.stderr.on('data', data => {
        log.warn('Windows taskbar update stderr:', data)
    })
    command.on('exit', code => {
        log.debug('Windows taskbar update cmd exited with:', code)
    })
    // Accumulate stdout text
    command.stdout.on('data', data => {
        stdout += data
    })
    command.stdout.on('close', () => {
        // Regex the key's value
        const res = stdout.match(new RegExp('SystemUsesLightTheme\\s+REG_DWORD\\s+([^\\s]+)'))
        // Determine the icon path that should be used
        let newPath = WINDOWS_TOOLBAR_ICON_PATH
        if (res && res.length >= 2 && res[1] === '0x1') {
            newPath = WINDOWS_TOOLBAR_LIGHT_ICON_PATH
        }
        setToolbarIcon(newPath)
    })
}

global.mb = menubar({
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
    ipc.callRenderer<boolean>(mb.window!, VISIBILITY_CHANGE_ALERT_CHANNEL, visible)
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
        updateToolbarIcon()
    })

    mb.on('show', () => {
        visibilityChangeAlert(true)
        setWindowVisibility(true)
        updateToolbarIcon()

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

    // Check if toolbar icon should be updated (Windows only)
    updateToolbarIcon()

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
async function configureStartOnLogin(shouldStart: boolean) {
    // Handle differently if windows store build
    if (process.windowsStore === true) {
        let task
        try {
            task = await WindowsStoreAutoLaunch.getStartupTask('SpaceEyeStartup')
        } catch (error) {
            log.error('Failed to get start on login MS task:', error)
            return
        }
        if (task !== undefined && task.state !== StartupTaskState.disabledByUser) {
            if (task.state === StartupTaskState.disabled && shouldStart) {
                task.requestEnableAsync((error, _) => {
                    if (error) {
                        log.error('Failed to enable start on login for MS build')
                    }
                })
            } else if (task.state === StartupTaskState.enabled && !shouldStart) {
                task.disable()
            }
        } else {
            log.warn('User has disabled start on login from task manager; unable to change')
        }
        return
    }
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

ipc.answerRenderer(QUIT_APPLICATION_CHANNEL, () => {
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

ipc.answerRenderer<number, void>(SET_WALLPAPER_CHANNEL, async viewId => {
    log.info('Wallpaper set request received for view:', viewId)
    AppConfigStore.currentViewId = viewId
    await WallpaperManager.update(Initiator.user)
})

ipc.answerRenderer<number, void>(RELOAD_VIEW, async viewId => {
    log.info('Reload request received for view:', viewId)
    await WallpaperManager.update(Initiator.user, true)
})

ipc.answerRenderer<void, number | undefined>(GET_CURRENT_VIEW_CHANNEL, () => {
    log.info('Current view request received')
    return AppConfigStore.currentViewId
})

ipc.answerRenderer<DownloadThumbnailIpcRequest, DownloadedThumbnailIpc>(
    DOWNLOAD_THUMBNAIL_CHANNEL,
    async request => {
        log.info('Download thumbnail request received')
        let webResponse
        try {
            webResponse = await Axios.get(request.url, {
                responseType: 'arraybuffer',
                headers: { 'If-None-Match': request.etag ?? '' },
                validateStatus: status => (status >= 200 && status < 300) || status === 304
            })
        } catch (error) {
            log.error('Error while downloading thumbnail:', formatAxiosError(error))
            return {}
        }
        if (webResponse.status === 304) {
            return { isModified: false }
        }
        const b64Image = Buffer.from(webResponse.data, 'binary').toString('base64')
        const contentType = webResponse.headers['content-type'] ?? 'image/jpeg'
        let timeTaken: number | undefined
        if (webResponse.headers['x-amz-meta-time-image-taken'] !== undefined) {
            timeTaken = moment.utc(webResponse.headers['x-amz-meta-time-image-taken']).valueOf()
        }
        return {
            isModified: true,
            dataUrl: `data:${contentType};base64,${b64Image}`,
            isBackup: toBoolean(webResponse.headers['x-amz-meta-is-backup'] ?? ''),
            timeTaken,
            etag: webResponse.headers.etag ?? undefined
        }
    }
)

ipc.answerRenderer<void, boolean | undefined>(GET_START_ON_LOGIN, () => {
    return AppConfigStore.startOnLogin
})

ipc.answerRenderer<boolean>(SET_START_ON_LOGIN, startOnLogin => {
    AppConfigStore.startOnLogin = startOnLogin
    configureStartOnLogin(startOnLogin)
})

ipc.answerRenderer<void, boolean>(GET_FIRST_RUN, () => {
    return AppConfigStore.firstRun
})

ipc.answerRenderer<boolean>(SET_FIRST_RUN, firstRun => {
    AppConfigStore.firstRun = firstRun
})

ipc.answerRenderer<void, boolean>(GET_AUTO_UPDATE, () => {
    return AppConfigStore.autoUpdate
})

ipc.answerRenderer<boolean>(SET_AUTO_UPDATE, autoUpdate => {
    AppConfigStore.autoUpdate = autoUpdate
})

ipc.answerRenderer(OPEN_WINDOWS_ICON_SETTINGS, () => {
    if (process.platform !== 'win32') {
        return
    }
    log.info('Opening Windows icon settings')
    // Special command that opens Windows notification area icon settings
    const command = spawn('cmd.exe', ['/c', 'start ms-settings:taskbar'])

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

ipc.answerRenderer<number, number | undefined>(GET_VIEW_DOWNLOAD_TIME, viewId => {
    log.info('Getting latest download time for view', viewId)
    return latestViewDownloadTimes[viewId]
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
