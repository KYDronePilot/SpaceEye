import { Display } from 'electron'

import { ScalingOption } from '../../shared/config_types'

export interface OSWallpaperInterface {
    /**
     * Set the wallpaper image for a monitor.
     *
     * @param monitor - Monitor to set on
     * @param path - Path to the image
     */
    setWallpaper(monitor: Display, monitorIndex: number, path: string, scaling: ScalingOption): void

    /**
     * Get the wallpaper image path for a particular monitor.
     *
     * @param monitor - Monitor to get image path for
     * @returns Path to monitor image
     */
    getWallpaper(monitor: Display, monitorIndex: number): string
}
