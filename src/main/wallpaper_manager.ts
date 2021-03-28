/**
 * For managing the changing backgrounds.
 */

// eslint-disable-next-line max-classes-per-file
import { Display, screen } from 'electron'
import { ipcMain as ipc } from 'electron-better-ipc'
import electronLog from 'electron-log'
import { maxBy } from 'lodash'
import moment from 'moment'

import { ImageSource, SatelliteView } from '../shared/config_types'
import { VIEW_DOWNLOAD_PROGRESS } from '../shared/IpcDefinitions'
import { AppConfigStore } from './app_config_store'
import { DownloadedImage } from './downloaded_image'
import {
    LockInvalidatedError,
    MonitorConfigChangedError,
    RequestCancelledError,
    RequestError,
    ViewConfigAccessError,
    ViewNotSetError
} from './errors'
import { downloadImage } from './image_downloader'
import { OSWallpaperInterface } from './os_wallpaper_interface'
import { MacOSWallpaperInterface } from './os_wallpaper_interface/macos'
import { WindowsWallpaperInterface } from './os_wallpaper_interface/windows'
import { SatelliteConfigStore } from './satellite_config_store'
import { Initiator, UpdateLock } from './update_lock'

const log = electronLog.scope('wallpaper-manager')

let wallpaperInterface: OSWallpaperInterface
if (process.platform === 'darwin') {
    wallpaperInterface = new MacOSWallpaperInterface()
} else {
    wallpaperInterface = new WindowsWallpaperInterface()
}

export const latestViewDownloadTimes: { [key: number]: number | undefined } = {}

export class WallpaperManager {
    private static instance?: WallpaperManager

    /**
     * Path to the current wallpaper image
     */
    imagePath?: string

    public static get Instance(): WallpaperManager {
        if (this.instance === undefined) {
            this.instance = new this()
        }
        return this.instance
    }

    /**
     * Get all non-internal monitors.
     *
     * @returns All non-internal monitors
     */
    private static getMonitors(): Display[] {
        const allMonitors = screen.getAllDisplays().filter(monitor => !monitor.internal)
        log.debug(
            'All monitors:',
            allMonitors.map(monitor => monitor.id)
        )
        return allMonitors
    }

    /**
     * Select the image source that best matches the monitor.
     *
     * @param monitor - Monitor in question
     * @param sources - Possible image sources
     * @returns Selected image
     */
    private static selectImageSourceForMonitor(
        monitor: Display,
        sources: ImageSource[]
    ): ImageSource {
        for (const source of sources) {
            if (
                source.dimensions[0] > monitor.scaleFactor * monitor.size.width &&
                source.dimensions[1] > monitor.scaleFactor * monitor.size.height
            ) {
                return source
            }
        }
        return sources[sources.length - 1]
    }

    /**
     * Given a view, determine the optimal image needed.
     *
     * Image is selected based on the resolution of available screens.
     *
     * @param view - Satellite view
     * @param monitors - Computer monitors currently available
     * @returns Selected image
     */
    private static getOptimalImageFromView(view: SatelliteView, monitors: Display[]): ImageSource {
        // Get the best image size for each monitor
        const possibleImages = monitors.map(monitor =>
            WallpaperManager.selectImageSourceForMonitor(monitor, view.imageSources)
        )
        // Pick the biggest one
        const bestImage = maxBy(possibleImages, image => image.dimensions[0] * image.dimensions[1])!
        log.debug(`Optimal image for view "${view.id}": ${bestImage.id}`)
        return bestImage
    }

    /**
     * Check if the monitor configuration has changed.
     *
     * @param oldMonitors - Old configuration of monitors
     * @param newMonitors - New configuration of monitors
     * @returns Whether the config has changed
     */
    private static haveMonitorsChanged(oldMonitors: Display[], newMonitors: Display[]): boolean {
        // TODO: Check monitor sizes too
        return oldMonitors.length !== newMonitors.length
    }

    /**
     * Non-error catching pipeline to update the wallpaper.
     *
     * @param lock - Acquired update pipeline lock
     * @throws {ViewNotSetError} if view not set in config when running
     * @throws {ViewConfigAccessError} if there's an issue while obtaining the
     * current view config
     * @throws {LockInvalidatedError} if lock is invalidated while updating
     * @throws {RequestCancelledError} if download request was cancelled
     * @throws {FileDoesNotExistError} if image not downloaded properly
     * @throws {MonitorConfigChangedError} if the monitor config changed while
     * running update tasks
     * @throws {Error} Unknown errors
     */
    public static async updatePipeline(lock: UpdateLock): Promise<void> {
        log.debug('Entering update pipeline')
        const viewId = AppConfigStore.currentViewId
        // If no view ID set, nothing to update
        if (viewId === undefined) {
            log.debug('No view set to update')
            throw new ViewNotSetError()
        }
        // Fetch the view config
        let viewConfig: SatelliteView | undefined
        try {
            viewConfig = await SatelliteConfigStore.Instance.getViewById(viewId)
        } catch (error) {
            log.debug('Error while fetching view config for update pipeline')
            if (error instanceof RequestError) {
                throw new ViewConfigAccessError(
                    `Error while downloading view config for ID "${viewId}"`
                )
            }
            throw error
        }
        // Make sure we still have the lock
        if (!lock.isStillHeld()) {
            log.debug('Lost update lock after getting view config')
            throw new LockInvalidatedError()
        }
        // If no config for ID, we can't proceed
        if (viewConfig === undefined) {
            log.debug('No view config for ID:', viewId)
            throw new ViewConfigAccessError(`No view config matching ID "${viewId}"`)
        }
        // Determine which image we need
        log.debug('Determining which image is needed to update')
        const monitors = WallpaperManager.getMonitors()
        const imageConfig = WallpaperManager.getOptimalImageFromView(viewConfig, monitors)
        // Get the newest downloaded image for the config
        let imageToSet = await DownloadedImage.getNewestDownloadedImage(imageConfig.id)
        // Make sure we still have the lock
        if (!lock.isStillHeld()) {
            log.debug('Lost update lock after checking for newest downloaded image')
            throw new LockInvalidatedError()
        }
        // If there isn't a downloaded image or it's too old, download a new one
        if (
            imageToSet === undefined ||
            moment.utc().diff(imageToSet.timestamp, 'seconds') > imageConfig.updateInterval
        ) {
            log.info('New image must be downloaded')
            imageToSet = await downloadImage(
                imageConfig,
                lock.generateCancelToken(),
                lock,
                percentage => {
                    if (mb.window !== undefined) {
                        // Skip if percentage is a number not divisible by 5
                        // This prevents IPC from being overwhelmed
                        if (percentage !== undefined && percentage !== -1 && percentage % 5 !== 0) {
                            return
                        }
                        ipc.callRenderer<number | undefined>(
                            mb.window,
                            `${VIEW_DOWNLOAD_PROGRESS}_${viewConfig!.id}`,
                            percentage
                        )
                    }
                }
            )
            // Make sure we still have the lock
            if (!lock.isStillHeld()) {
                log.debug('Lost update lock while downloading image')
                throw new LockInvalidatedError()
            }
        }
        latestViewDownloadTimes[viewId] = imageToSet.timestamp.valueOf()
        // Make sure the monitor config hasn't changed
        const newMonitors = WallpaperManager.getMonitors()
        if (WallpaperManager.haveMonitorsChanged(monitors, newMonitors)) {
            log.debug('Monitors changed during update process')
            throw new MonitorConfigChangedError()
        }
        // Get monitors that don't already have the image set
        const monitorsToSet = monitors.filter(
            (monitor, i) => wallpaperInterface.getWallpaper(monitor, i) !== imageToSet!.getPath()
        )
        // Set the wallpaper on monitors that don't have it set yet
        monitorsToSet.forEach((monitor, i) =>
            wallpaperInterface.setWallpaper(
                monitor,
                i,
                imageToSet!.getPath(),
                imageConfig.defaultScaling
            )
        )
    }

    /**
     * Update the wallpaper according to the config.
     *
     * @param initiator - Who is initiating the update
     * @returns Whether the update completed successfully
     */
    public static async update(initiator: Initiator): Promise<boolean> {
        const lock = UpdateLock.acquire(initiator)
        // If we couldn't get the lock, we can't proceed
        if (lock === undefined) {
            log.info(`Update triggered by ${initiator}, lock acquisition failed`)
            return false
        }
        log.info(`Update triggered by ${initiator}, lock acquisition succeeded`)
        try {
            // Try to run the pipeline and release the lock when done
            await WallpaperManager.updatePipeline(lock)
            lock.release()
            // Delete old images
            await DownloadedImage.cleanupOldImages()
            return true
        } catch (error) {
            if (error instanceof RequestCancelledError) {
                log.info('Image download request cancelled')
                return false
            }
            log.error('Error while updating. Invalidating lock.', error)
            lock.invalidate()
            // If there was an error, we couldn't complete successfully
            // TODO: Log the error and let the user know if it is worth
            //  knowing
            return false
        }
    }
}
