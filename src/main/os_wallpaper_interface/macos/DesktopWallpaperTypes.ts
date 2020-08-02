export declare enum ImageScaling {
    axesIndependently = 1,
    none = 2,
    proportionallyUpOrDown = 3
}
export interface DesktopFillColor {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}
export interface DesktopImageOptions {
    imageScaling: ImageScaling;
    allowClipping: boolean;
    desktopFillColor: DesktopFillColor;
}
export declare function GetWallpaperOptionsForScreen(displayID: number): DesktopImageOptions;
export declare function GetWallpaperPathForScreen(displayID: number): string;
export declare function SetWallpaper(displayID: number, wallpaperPath: string, options?: DesktopImageOptions): void;
