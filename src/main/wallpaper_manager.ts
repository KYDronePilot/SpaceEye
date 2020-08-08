/**
 * For managing the changing backgrounds.
 */

// eslint-disable-next-line max-classes-per-file
import Axios, { CancelToken, CancelTokenSource } from 'axios'
import { Display, screen } from 'electron'
import { maxBy, update } from 'lodash'
import moment, { Moment } from 'moment'
import { basename, dirname } from 'path'

import { AppConfigStore } from './config_manager'
import { downloadImage, RequestCancelledError } from './image_download_manager'
import { OSWallpaperInterface } from './os_wallpaper_interface'
import { MacOSWallpaperInterface } from './os_wallpaper_interface/macos'
import { WindowsWallpaperInterface } from './os_wallpaper_interface/windows'
import { SatelliteConfigStore } from './satellite_config_store'
import { Initiator, UpdateLock } from './update_lock'
import { DownloadedImage, IMAGE_DIR } from './wallpaper_requester'

let wallpaperInterface: OSWallpaperInterface
if (process.platform === 'darwin') {
    wallpaperInterface = new MacOSWallpaperInterface()
} else {
    wallpaperInterface = new WindowsWallpaperInterface()
}
const DOWNLOAD_TIMEOUT = 300000
export const UPDATE_INTERVAL_MIN = 20
export class LockAcquisitionRejectedError extends Error {}
export class LockCancelledError extends Error {}

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

    // /**
    //  * Get the current satellite view being displayed.
    //  */
    // private static async getNewestDownloadedImage(): Promise<DownloadedImage | undefined> {
    //     const monitors = WallpaperManager.getMonitors()
    //     const imagePaths = monitors.map((monitor, i) => wallpaperInterface.getWallpaper(monitor, i))
    //     const ourImagePaths = imagePaths.filter(path => dirname(path) === IMAGE_DIR)
    //     const images = ourImagePaths.map(path => DownloadedImage.constructFromPath(path))
    //     if (images.length === 0) {
    //         return undefined
    //     }
    //     return maxBy(images, image => image.timestamp.valueOf())!
    // }

    // /**
    //  * Download a wallpaper image.
    //  *
    //  * @param image - Image to download
    //  * @returns
    //  */
    // private static async downloadImage(image: ImageSource): Promise<DownloadedImage | undefined> {
    //     const downloadManager = ImageDownloadManager.Instance
    //     try {
    //         return await downloadManager.downloadImage(image, -1, DOWNLOAD_TIMEOUT)
    //     } catch (error) {
    //         if (error instanceof RequestCancelledError) {
    //             // TODO: Handle timeout errors
    //             console.log('We were cancelled')
    //             return undefined
    //         }
    //         throw error
    //     }
    // }

    // /**
    //  * Set the wallpaper to a particular view ID
    //  *
    //  * @param viewId - ID of view to set wallpaper to
    //  */
    // public static async setWallpaper(viewId: number): Promise<void> {
    //     const viewConfig = await SatelliteConfigStore.Instance.getViewById(viewId)
    //     if (viewConfig === undefined) {
    //         throw new Error('Specified view ID does not exist')
    //     }
    //     const monitors = WallpaperManager.getMonitors()
    //     const imageSources = monitors.map(monitor =>
    //         WallpaperManager.selectImageSourceForMonitor(monitor, viewConfig.imageSources)
    //     )
    //     const biggestImageSource = maxBy(
    //         imageSources,
    //         source => source.dimensions[0] * source.dimensions[1]
    //     )
    //     // If that image already exists, no need to download it
    //     let downloadedImage: DownloadedImage | undefined
    //     downloadedImage = await DownloadedImage.getNewestDownloadedImage(biggestImageSource!.id)
    //     if (
    //         downloadedImage === undefined ||
    //         moment.utc().diff(downloadedImage.timestamp, 'minutes') > UPDATE_INTERVAL_MIN
    //     ) {
    //         downloadedImage = await WallpaperManager.downloadImage(biggestImageSource!)
    //     }
    //     monitors.forEach((monitor, i) => {
    //         wallpaperInterface.setWallpaper(monitor, i, downloadedImage!.getPath())
    //     })
    // }

    /**
     * Change the wallpaper to a different view.
     *
     * @param viewId - ID of the new view
     */
    public static changeWallpaper(viewId: number): void {
        AppConfigStore.currentViewId = viewId
    }

    // /**
    //  * Check if wallpaper needs to be updated and do so if necessary.
    //  */
    // public static async updateWallpaper(): Promise<void> {
    //     const newestDownloadedImage = await WallpaperManager.getNewestDownloadedImage()
    //     if (
    //         newestDownloadedImage === undefined ||
    //         !(moment.utc().diff(newestDownloadedImage.timestamp, 'minutes') > UPDATE_INTERVAL_MIN)
    //     ) {
    //         return
    //     }
    //     const view = await SatelliteConfigStore.Instance.getViewByImageId(
    //         newestDownloadedImage.imageId
    //     )
    //     if (view === undefined) {
    //         return
    //     }
    //     await WallpaperManager.setWallpaper(view.id)
    // }

    /**
     * Non-error catching pipeline to update the wallpaper.
     *
     * @param lock - Acquired update pipeline lock
     * @throws Unknown errors
     * @throws LockCancelledError if lock is cancelled while updating
     */
    public static async updatePipeline(lock: UpdateLock): Promise<undefined> {
        const viewId = AppConfigStore.currentViewId
        // If no view ID set, nothing to update
        // TODO: Should this check be done here?
        if (viewId === undefined) {
            return
        }
        // Fetch the view config
        const viewConfig = await SatelliteConfigStore.Instance.getViewById(viewId)
        // If view ID does not correspond to a config, nothing to update
        // TODO: Should the check be done here?
        if (viewConfig === undefined) {
            return
        }
        // Make sure we still have the lock
        if (!lock.isStillValid()) {
            throw new LockCancelledError()
        }
        // Determine which image we need
        const monitors = WallpaperManager.getMonitors()
        const imageConfig = WallpaperManager.getOptimalImageFromView(viewConfig, monitors)
        // Get the newest downloaded image for the config
        let imageToSet = await DownloadedImage.getNewestDownloadedImage(imageConfig.id)
        // Make sure we still have the lock
        if (!lock.isStillValid()) {
            throw new LockCancelledError()
        }
        // If there isn't a downloaded image or it's too old, download a new one
        if (
            imageToSet === undefined ||
            moment.utc().diff(imageToSet.timestamp, 'minutes') > UPDATE_INTERVAL_MIN
        ) {
            imageToSet = await downloadImage(imageConfig, lock)
            // Make sure we still have the lock
            if (!lock.isStillValid()) {
                throw new LockCancelledError()
            }
            // If no image downloaded, return
            // TODO: More checking needs to be done here
            if (imageToSet === undefined) {
                return
            }
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
            return true
        } catch (error) {
            // If the lock was cancelled, we weren't successful
            if (error instanceof LockCancelledError) {
                return false
            }
            // If an unknown error, propagate to caller
            throw error
        }
    }
}
