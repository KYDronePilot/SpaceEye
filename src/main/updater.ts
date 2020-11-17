import { dialog } from 'electron'
import electronLog from 'electron-log'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import { setInterval } from 'timers'

import { AppConfigStore } from './app_config_store'

const log = electronLog.scope('auto-updater')

// Update versions that the user has been alerted of
const updateAlertVersions: Record<string, boolean> = {}

autoUpdater.logger = log
autoUpdater.autoDownload = true

let isUpdateDownloaded = false
let isWindowVisible = false

/**
 * Do a full auto update if enabled, one is available, and the app window is
 * closed.
 */
function tryUpdating() {
    if (isUpdateDownloaded && !isWindowVisible && AppConfigStore.autoUpdate) {
        log.info('Doing full-auto update in background')
        autoUpdater.quitAndInstall()
    } else {
        log.info(
            'Unable to do full-auto update. Is downloaded:',
            isUpdateDownloaded,
            'Is window visible:',
            isWindowVisible,
            'Is auto update enabled:',
            AppConfigStore.autoUpdate
        )
    }
}

/**
 * Set whether the app window is visible, trying an auto update if not visible.
 *
 * @param visible - Whether the window is visible or not
 */
export function setWindowVisibility(visible: boolean): void {
    isWindowVisible = visible
    if (!visible) {
        tryUpdating()
    }
}

/**
 * Prompt the user to see if they want to update the app.
 *
 * @param info - Info about the update
 */
async function promptForUpdate(info: UpdateInfo) {
    // Don't alert the user more than once for an update version
    if (updateAlertVersions[info.version] === true) {
        return
    }
    updateAlertVersions[info.version] = true

    const res = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Restart', 'Later'],
        message: 'Update Ready to Install',
        detail:
            'A new version of SpaceEye is ready to install. Restart application to apply the update.',
        defaultId: 0,
        cancelId: 1
    })
    if (res.response === 0) {
        autoUpdater.quitAndInstall()
    }
}

// Handle when an update is downloaded
autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    isUpdateDownloaded = true
    if (AppConfigStore.autoUpdate) {
        tryUpdating()
    } else {
        promptForUpdate(info)
    }
})

/**
 * Start an interval timer to check for updates every 10 minutes.
 */
export function startUpdateChecking(): void {
    // No auto-updating when running in dev mode
    if (process.env.NODE_ENV !== 'production') {
        return
    }
    autoUpdater.checkForUpdates()

    log.info('Starting update checker interval')
    setInterval(() => {
        autoUpdater.checkForUpdates()
    }, 600000)
}
