import electronLog from 'electron-log'
import fse from 'fs-extra'
import Path from 'path'

import { OSWallpaperInterface } from '..'
import { ScalingOption } from '../../../shared/config_types'
import { IMAGES_DIR, UWP_IMAGE_DIRS } from '../../paths'
import * as DesktopWallpaper from './DesktopWallpaperTypes'

const log = electronLog.scope('windows-wallpaper-interface')

let WindowsDesktopWallpaper: typeof DesktopWallpaper
if (process.platform === 'win32') {
    WindowsDesktopWallpaper = __non_webpack_require__('space-eye-windows-node-api')
        .IDesktopWallpaper as typeof DesktopWallpaper
} else {
    WindowsDesktopWallpaper = {} as typeof DesktopWallpaper
}

export class WindowsWallpaperInterface implements OSWallpaperInterface {
    // eslint-disable-next-line class-methods-use-this
    setWallpaper(
        _: Electron.Display,
        monitorIndex: number,
        path: string,
        scaling: ScalingOption
    ): void {
        // Special handling for UWP (Windows Store) builds when setting to a downloaded image
        let actualPath = path
        if (process.windowsStore === true && Path.dirname(path) === IMAGES_DIR) {
            // First, check each alternate image dir to see if the image file exists
            for (const imagesDir of UWP_IMAGE_DIRS) {
                const alternatePath = Path.join(imagesDir, Path.basename(path))
                // If the file exists there, use it when calling the win32 API
                if (fse.existsSync(alternatePath)) {
                    log.info(`Real path of "${path}" found:`, alternatePath)
                    actualPath = alternatePath
                    break
                }
            }
        }
        const monitorId = WindowsDesktopWallpaper.GetMonitorDevicePathAt(monitorIndex)
        log.debug(
            `Setting wallpaper. Index: ${monitorIndex}, ID: "${monitorId}", Path: "${actualPath}"`
        )
        WindowsDesktopWallpaper.SetWallpaper(monitorId, actualPath)
        if (scaling === ScalingOption.fill) {
            WindowsDesktopWallpaper.SetPosition(WindowsDesktopWallpaper.WallpaperPosition.fill)
        } else {
            WindowsDesktopWallpaper.SetPosition(WindowsDesktopWallpaper.WallpaperPosition.fit)
        }
    }

    // eslint-disable-next-line class-methods-use-this
    getWallpaper(_: Electron.Display, monitorIndex: number): string {
        const monitorId = WindowsDesktopWallpaper.GetMonitorDevicePathAt(monitorIndex)
        const wallpaperPath = WindowsDesktopWallpaper.GetWallpaper(monitorId)
        log.debug(
            `Wallpaper on monitor (Index: ${monitorIndex}, ID: "${monitorId}"): "${wallpaperPath}"`
        )
        return wallpaperPath
    }
}
