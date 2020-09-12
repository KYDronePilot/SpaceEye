import { dialog } from 'electron'
import electronLog from 'electron-log'
import { autoUpdater } from 'electron-updater'
import { setInterval } from 'timers'

const log = electronLog.scope('auto-updater')

autoUpdater.logger = log
autoUpdater.allowPrerelease = true
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

autoUpdater.on('update-downloaded', async () => {
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
    setInterval(() => {
        autoUpdater.checkForUpdates()
    }, 600000)
}
