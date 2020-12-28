/**
 * Statuses of an image.
 */
export enum ImageStatusState {
    updated,
    loading,
    error
}

export interface ImageStatus {
    state: ImageStatusState
    lastUpdated?: number
    message?: string
}

export interface ImageStatusUpdate {
    viewId: number
    status: ImageStatus
}
