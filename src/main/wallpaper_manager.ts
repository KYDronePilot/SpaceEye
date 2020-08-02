/**
 * For managing the changing backgrounds.
 */

import Axios, { CancelToken, CancelTokenSource } from 'axios'
import { DesktopWallpaper } from 'earth_from_space_live_mac_node_api'
import { Display, screen } from 'electron'
import { maxBy } from 'lodash'
import moment, { Moment } from 'moment'
import { basename, dirname } from 'path'

import { ImageDownloadManager, RequestCancelledError } from './image_download_manager'
import { OSWallpaperInterface } from './os_wallpaper_interface'
import { MacOSWallpaperInterface } from './os_wallpaper_interface/macos'
import { WindowsWallpaperInterface } from './os_wallpaper_interface/windows'
import { SatelliteConfigStore } from './satellite_config_store'
import { DownloadedImage, downloadImage, IMAGE_DIR } from './wallpaper_requester'

let wallpaperInterface: OSWallpaperInterface
if (process.platform === 'darwin') {
    wallpaperInterface = new MacOSWallpaperInterface()
} else {
    wallpaperInterface = new WindowsWallpaperInterface()
}
const DOWNLOAD_TIMEOUT = 300000
export const UPDATE_INTERVAL_MIN = 20

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
     * Get the view config for a view ID.
     * @param viewId - View ID to get config for
     * @returns View config if one exists
     */
    private static async getViewConfig(viewId: number): Promise<SatelliteView | undefined> {
        const configStore = SatelliteConfigStore.Instance
        const config = await configStore.getConfig()
        for (const satellite of config.satellites) {
            for (const view of satellite.views) {
                if (view.id === viewId) {
                    return view
                }
            }
        }
        return undefined
    }

    /**
     * Get all non-internal monitors.
     * @returns All non-internal monitors
     */
    private static getMonitors(): Display[] {
        return screen.getAllDisplays().filter(monitor => !monitor.internal)
    }

    /**
     * Select the image source that best matches the monitor.
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
     * Get the current satellite view being displayed.
     */
    private static async getNewestDownloadedImage(): Promise<DownloadedImage | undefined> {
        const monitors = WallpaperManager.getMonitors()
        const imagePaths = monitors.map((monitor, i) => wallpaperInterface.getWallpaper(monitor, i))
        const ourImagePaths = imagePaths.filter(path => dirname(path) === IMAGE_DIR)
        const images = ourImagePaths.map(path => DownloadedImage.constructFromPath(path))
        if (images.length === 0) {
            return undefined
        }
        return maxBy(images, image => image.timestamp.valueOf())!
    }

    private static async imageIdToView(id: number): Promise<SatelliteView | undefined> {
        const configStore = SatelliteConfigStore.Instance
        const config = await configStore.getConfig()
        for (const satellite of config.satellites) {
            for (const view of satellite.views) {
                for (const image of view.imageSources) {
                    if (image.id === id) {
                        return view
                    }
                }
            }
        }
        return undefined
    }

    /**
     * Download a wallpaper image.
     * @param image - Image to download
     */
    private static async downloadImage(image: ImageSource): Promise<DownloadedImage | undefined> {
        const downloadManager = ImageDownloadManager.Instance
        try {
            return await downloadManager.downloadImage(image, -1, DOWNLOAD_TIMEOUT)
        } catch (error) {
            if (error instanceof RequestCancelledError) {
                // TODO: Handle timeout errors
                console.log('We were cancelled')
                return undefined
            }
            throw error
        }
    }

    /**
     * Set the wallpaper to a particular view ID
     * @param viewId - ID of view to set wallpaper to
     */
    public static async setWallpaper(viewId: number): Promise<void> {
        const viewConfig = await WallpaperManager.getViewConfig(viewId)
        if (viewConfig === undefined) {
            throw new Error('Specified view ID does not exist')
        }
        const monitors = WallpaperManager.getMonitors()
        const imageSources = monitors.map(monitor =>
            WallpaperManager.selectImageSourceForMonitor(monitor, viewConfig.imageSources)
        )
        const biggestImageSource = maxBy(
            imageSources,
            source => source.dimensions[0] * source.dimensions[1]
        )
        // If that image already exists, no need to download it
        let downloadedImage: DownloadedImage | undefined
        downloadedImage = await DownloadedImage.constructNewestExistingImage(biggestImageSource!.id)
        if (downloadedImage === undefined) {
            downloadedImage = await WallpaperManager.downloadImage(biggestImageSource!)
        }
        for (const monitor of monitors) {
            DesktopWallpaper.SetWallpaper(monitor.id, downloadedImage!.getPath())
        }
    }

    /**
     * Check if wallpaper needs to be updated and do so if necessary.
     */
    public static async updateWallpaper(): Promise<void> {
        const newestDownloadedImage = await WallpaperManager.getNewestDownloadedImage()
        if (
            newestDownloadedImage === undefined ||
            !(moment.utc().diff(newestDownloadedImage.timestamp, 'minutes') > UPDATE_INTERVAL_MIN)
        ) {
            return
        }
        const view = await WallpaperManager.imageIdToView(newestDownloadedImage.imageId)
        if (view === undefined) {
            return
        }
        await WallpaperManager.setWallpaper(view.id)
    }
}
