import { DesktopWallpaper } from 'earth_from_space_live_mac_node_api'

import { OSWallpaperInterface } from '.'

export class MacOSWallpaperInterface implements OSWallpaperInterface {
    // eslint-disable-next-line class-methods-use-this
    setWallpaper(monitor: Electron.Display, path: string): void {
        DesktopWallpaper.SetWallpaper(monitor.id, path)
    }

    // eslint-disable-next-line class-methods-use-this
    getWallpaper(monitor: Electron.Display): string {
        return DesktopWallpaper.GetWallpaperPathForScreen(monitor.id)
    }
}
