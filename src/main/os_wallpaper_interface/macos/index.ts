import { OSWallpaperInterface } from '..'
import * as DesktopWallpaper from './DesktopWallpaperTypes'

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
        MacDesktopWallpaper.SetWallpaper(monitor.id, path)
    }

    // eslint-disable-next-line class-methods-use-this
    getWallpaper(monitor: Electron.Display, _: number): string {
        return MacDesktopWallpaper.GetWallpaperPathForScreen(monitor.id)
    }
}
