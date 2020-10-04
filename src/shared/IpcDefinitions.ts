// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IpcParams {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IpcResponse {}

export interface IpcRequest<P extends IpcParams> {
    params: P
    responseChannel: string
}

export type QuitApplicationIpcParams = IpcParams
export type QuitApplicationIpcResponse = IpcResponse
export const QUIT_APPLICATION_CHANNEL = 'QUIT_APPLICATION_CHANNEL'

export interface ExampleIpcParams {
    testP: string
}

export interface ExampleIpcResponse {
    testR: string
}

export interface GetSatelliteConfigIpcResponse {
    config?: RootSatelliteConfig
}

export interface SetWallpaperIpcParams {
    viewId: number
}

export interface VisibilityChangeAlertIpcParams {
    visible: boolean
}

export interface GetCurrentViewIpcResponse {
    viewId?: number
}

export interface DownloadThumbnailIpcResponse {
    dataUrl?: string
}

export interface DownloadThumbnailIpcParams {
    url: string
}

export interface GetStartOnLoginIpcResponse {
    startOnLogin?: boolean
}

export interface SetStartOnLoginIpcParams {
    startOnLogin: boolean
}

export const EXAMPLE_CHANNEL = 'EXAMPLE_CHANNEL'
export const GET_SATELLITE_CONFIG_CHANNEL = 'GET_SATELLITE_CONFIG_CHANNEL'
export const SET_WALLPAPER_CHANNEL = 'SET_WALLPAPER_CHANNEL'
export const VISIBILITY_CHANGE_ALERT_CHANNEL = 'VISIBILITY_CHANGE_ALERT_CHANNEL'
export const GET_CURRENT_VIEW_CHANNEL = 'GET_CURRENT_VIEW_CHANNEL'
export const DOWNLOAD_THUMBNAIL_CHANNEL = 'DOWNLOAD_THUMBNAIL_CHANNEL'
export const GET_START_ON_LOGIN = 'GET_START_ON_LOGIN'
export const SET_START_ON_LOGIN = 'SET_START_ON_LOGIN'
