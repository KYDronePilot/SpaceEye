import electronLog from 'electron-log'

import { OSWallpaperInterface } from '..'
import { ScalingOption } from '../../../shared/config_types'
import * as DesktopWallpaper from './DesktopWallpaperTypes'

const log = electronLog.scope('mac-wallpaper-interface')

let MacDesktopWallpaper: typeof DesktopWallpaper
if (process.platform === 'darwin') {
    MacDesktopWallpaper = __non_webpack_require__('space-eye-mac-node-api')
        .DesktopWallpaper as typeof DesktopWallpaper
} else {
    MacDesktopWallpaper = {} as typeof DesktopWallpaper
}

export class MacOSWallpaperInterface implements OSWallpaperInterface {
    // eslint-disable-next-line class-methods-use-this
    setWallpaper(monitor: Electron.Display, _: number, path: string, scaling: ScalingOption): void {
        log.debug(`Setting wallpaper. Monitor: ${monitor.id}, Path: "${path}"`)
        MacDesktopWallpaper.SetWallpaper(monitor.id, path, {
            imageScaling: MacDesktopWallpaper.ImageScaling.proportionallyUpOrDown,
            allowClipping: scaling === ScalingOption.fit,
            desktopFillColor: { red: 0, green: 0, blue: 0, alpha: 1 }
        })
    }

    // eslint-disable-next-line class-methods-use-this
    getWallpaper(monitor: Electron.Display, _: number): string {
        const wallpaperPath = MacDesktopWallpaper.GetWallpaperPathForScreen(monitor.id)
        log.debug(`Wallpaper on monitor ${monitor.id}: "${wallpaperPath}"`)
        return wallpaperPath
    }
}
