export enum MultiMonitorMode {
    independent = 'independent',
    unified = 'unified'
}

export interface DownloadThumbnailIpcRequest {
    url: string
    etag?: string
}

export interface DownloadedThumbnailIpc {
    isModified?: boolean
    dataUrl?: string
    isBackup?: boolean
    timeTaken?: number
    etag?: string
}

/**
 * Convert string to true, false, or undefined.
 *
 * @param value - String value to convert
 * @returns Resulting value
 */
export function toBoolean(value: string): boolean | undefined {
    if (value.toLowerCase() === 'true') {
        return true
    }
    if (value.toLowerCase() === 'false') {
        return false
    }
    return undefined
}
