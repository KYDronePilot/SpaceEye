import { dialog } from 'electron'
import electronLog from 'electron-log'
import { autoUpdater, UpdateInfo } from 'electron-updater'
import { setInterval } from 'timers'

const log = electronLog.scope('auto-updater')

// Update versions that the user has been alerted of
const updateAlertVersions: Record<string, boolean> = {}

autoUpdater.logger = log
autoUpdater.allowPrerelease = true
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('update-downloaded', async (info: UpdateInfo) => {
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
})

/**
 * Start an interval timer to check for updates every 10 minutes.
 */
export function startUpdateChecking(): void {
    autoUpdater.checkForUpdates()

    log.info('Starting update checker interval')
    setInterval(() => {
        autoUpdater.checkForUpdates()
    }, 600000)
}
