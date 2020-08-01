/**
 * For managing the changing backgrounds.
 */

import Axios, { CancelToken, CancelTokenSource } from 'axios'
import { DesktopWallpaper } from 'earth_from_space_live_mac_node_api'
import { Display, screen } from 'electron'
import { maxBy } from 'lodash'
import moment, { Moment } from 'moment'

import { SatelliteConfigStore } from './satellite_config_store'
import { downloadImage } from './wallpaper_requester'

export class WallpaperManager {
    private static instance?: WallpaperManager

    private downloadCancelToken?: CancelTokenSource

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

    // private async setSatelliteViewForMonitor(monitor: Display, view: SatelliteView) {
    //     const imageSource = await this.selectImageSourceForMonitor(monitor, view.imageSources)
    // }

    /**
     * Set the wallpaper to a particular view ID
     * @param viewId - ID of view to set wallpaper to
     */
    public async setWallpaper(viewId: number): Promise<void> {
        const viewConfig = await WallpaperManager.getViewConfig(viewId)
        if (viewConfig === undefined) {
            throw new Error('Specified view ID does not exist')
        }
        const monitors = screen.getAllDisplays().filter(monitor => !monitor.internal)
        const imageSources = monitors.map(monitor =>
            WallpaperManager.selectImageSourceForMonitor(monitor, viewConfig.imageSources)
        )
        const biggestImageSource = maxBy(
            imageSources,
            source => source.dimensions[0] * source.dimensions[1]
        )
        this.downloadCancelToken = Axios.CancelToken.source()
        const downloadedImage = await downloadImage(
            biggestImageSource!,
            60000,
            this.downloadCancelToken
        )

        for (const monitor of monitors) {
            DesktopWallpaper.SetWallpaper(monitor.id, downloadedImage.getPath())
        }
    }
}
