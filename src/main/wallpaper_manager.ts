/**
 * For managing the changing backgrounds.
 */

// eslint-disable-next-line max-classes-per-file
import { Display, screen } from 'electron'
import { maxBy } from 'lodash'
import moment from 'moment'

import { AppConfigStore } from './app_config_store'
import { UPDATE_INTERVAL_MIN } from './consts'
import { DownloadedImage } from './downloaded_image'
import {
    LockInvalidatedError,
    MonitorConfigChangedError,
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

let wallpaperInterface: OSWallpaperInterface
if (process.platform === 'darwin') {
    wallpaperInterface = new MacOSWallpaperInterface()
} else {
    wallpaperInterface = new WindowsWallpaperInterface()
}

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
        return screen.getAllDisplays().filter(monitor => !monitor.internal)
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
        return maxBy(possibleImages, image => image.dimensions[0] * image.dimensions[1])!
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
        const viewId = AppConfigStore.currentViewId
        // If no view ID set, nothing to update
        if (viewId === undefined) {
            throw new ViewNotSetError()
        }
        // Fetch the view config
        let viewConfig: SatelliteView | undefined
        try {
            viewConfig = await SatelliteConfigStore.Instance.getViewById(viewId)
        } catch (error) {
            if (error instanceof RequestError) {
                throw new ViewConfigAccessError(
                    `Error while downloading view config for ID "${viewId}"`
                )
            }
            throw error
        }
        // Make sure we still have the lock
        if (!lock.isStillHeld()) {
            throw new LockInvalidatedError()
        }
        // If no config for ID, we can't proceed
        if (viewConfig === undefined) {
            throw new ViewConfigAccessError(`No view config matching ID "${viewId}"`)
        }
        // Determine which image we need
        const monitors = WallpaperManager.getMonitors()
        const imageConfig = WallpaperManager.getOptimalImageFromView(viewConfig, monitors)
        // Get the newest downloaded image for the config
        let imageToSet = await DownloadedImage.getNewestDownloadedImage(imageConfig.id)
        // Make sure we still have the lock
        if (!lock.isStillHeld()) {
            throw new LockInvalidatedError()
        }
        // If there isn't a downloaded image or it's too old, download a new one
        if (
            imageToSet === undefined ||
            moment.utc().diff(imageToSet.timestamp, 'minutes') > UPDATE_INTERVAL_MIN
        ) {
            imageToSet = await downloadImage(imageConfig, lock.generateCancelToken(), lock)
            // Make sure we still have the lock
            if (!lock.isStillHeld()) {
                throw new LockInvalidatedError()
            }
        }
        // Make sure the monitor config hasn't changed
        const newMonitors = WallpaperManager.getMonitors()
        if (WallpaperManager.haveMonitorsChanged(monitors, newMonitors)) {
            throw new MonitorConfigChangedError()
        }
        // Get monitors that don't already have the image set
        const monitorsToSet = monitors.filter(
            (monitor, i) => wallpaperInterface.getWallpaper(monitor, i) !== imageToSet!.getPath()
        )
        // Set the wallpaper on monitors that don't have it set yet
        monitorsToSet.forEach((monitor, i) =>
            wallpaperInterface.setWallpaper(monitor, i, imageToSet!.getPath())
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
            return false
        }
        try {
            // Try to run the pipeline and release the lock when done
            await WallpaperManager.updatePipeline(lock)
            lock.release()
            // Delete old images
            await DownloadedImage.cleanupOldImages()
            return true
        } catch {
            lock.invalidate()
            // If there was an error, we couldn't complete successfully
            // TODO: Log the error and let the user know if it is worth
            //  knowing
            return false
        }
    }
}
