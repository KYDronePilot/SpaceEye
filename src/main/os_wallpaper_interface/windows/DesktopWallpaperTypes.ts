export declare class HResultError extends Error {
    constructor(error: number)
}
export declare enum WallpaperPosition {
    center = 'DWPOS_CENTER',
    tile = 'DWPOS_TILE',
    stretch = 'DWPOS_STRETCH',
    fit = 'DWPOS_FIT',
    fill = 'DWPOS_FILL',
    span = 'DWPOS_SPAN',
    error = 'ERROR'
}
export declare function GetMonitorDevicePathCount(): number
export declare function GetMonitorDevicePathAt(monitorIndex: number): string
export declare function GetWallpaper(monitorId: string): string
export declare function SetWallpaper(monitorId: string, wallpaperPath: string): void
export declare function GetPosition(): WallpaperPosition
export declare function SetPosition(position: WallpaperPosition): void
