import { OSWallpaperInterface } from '..'
import * as DesktopWallpaper from './DesktopWallpaperTypes'

let WindowsDesktopWallpaper: typeof DesktopWallpaper
if (process.platform === 'win32') {
    WindowsDesktopWallpaper = __non_webpack_require__(
        'earth_from_space_live_windows_node_api'
    ) as typeof DesktopWallpaper
} else {
    WindowsDesktopWallpaper = {} as typeof DesktopWallpaper
}

export class WindowsWallpaperInterface implements OSWallpaperInterface {
    // eslint-disable-next-line class-methods-use-this
    setWallpaper(_: Electron.Display, monitorIndex: number, path: string): void {
        const monitorId = WindowsDesktopWallpaper.GetMonitorDevicePathAt(monitorIndex)
        WindowsDesktopWallpaper.SetWallpaper(monitorId, path)
    }

    // eslint-disable-next-line class-methods-use-this
    getWallpaper(_: Electron.Display, monitorIndex: number): string {
        const monitorId = WindowsDesktopWallpaper.GetMonitorDevicePathAt(monitorIndex)
        return WindowsDesktopWallpaper.GetWallpaper(monitorId)
    }
}
