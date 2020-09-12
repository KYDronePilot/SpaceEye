import electronLog from 'electron-log'

import { OSWallpaperInterface } from '..'
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
    setWallpaper(_: Electron.Display, monitorIndex: number, path: string): void {
        const monitorId = WindowsDesktopWallpaper.GetMonitorDevicePathAt(monitorIndex)
        log.debug(`Setting wallpaper. Index: ${monitorIndex}, ID: "${monitorId}", Path: "${path}"`)
        WindowsDesktopWallpaper.SetWallpaper(monitorId, path)
        WindowsDesktopWallpaper.SetPosition(WindowsDesktopWallpaper.WallpaperPosition.fill)
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
