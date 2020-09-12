import electronLog from 'electron-log'

import { OSWallpaperInterface } from '..'
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
    setWallpaper(monitor: Electron.Display, _: number, path: string): void {
        log.debug(`Setting wallpaper. Monitor: ${monitor.id}, Path: "${path}"`)
        MacDesktopWallpaper.SetWallpaper(monitor.id, path)
    }

    // eslint-disable-next-line class-methods-use-this
    getWallpaper(monitor: Electron.Display, _: number): string {
        const wallpaperPath = MacDesktopWallpaper.GetWallpaperPathForScreen(monitor.id)
        log.debug(`Wallpaper on monitor ${monitor.id}: "${wallpaperPath}"`)
        return wallpaperPath
    }
}
