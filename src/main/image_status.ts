import { ipcMain as ipc } from 'electron-better-ipc'

import { FETCH_VIEW_STATUS, PUSH_VIEW_STATUS_CHANGE } from '../shared/IpcDefinitions'
import { ImageStatus, ImageStatusState, ImageStatusUpdate } from '../shared/types'

export class ImageStatusManager {
    /**
     * Map from view ID to status.
     */
    private static viewStatusStore: { [key: number]: ImageStatus } = {}

    /**
     * Initialize status manager.
     */
    private static init() {
        // Begin listening for view status fetch requests
        ipc.answerRenderer<number, ImageStatus>(FETCH_VIEW_STATUS, viewId => {
            if (!(viewId in ImageStatusManager.viewStatusStore)) {
                return {
                    state: ImageStatusState.loading,
                    message: 'Loading...'
                }
            }
            return ImageStatusManager.viewStatusStore[viewId]
        })
    }

    /**
     * Update the status of a view.
     *
     * @param viewId - ID of the view to update
     * @param status - New status of view
     */
    public static updateViewStatus(viewId: number, status: ImageStatus): void {
        ImageStatusManager.viewStatusStore[viewId] = status
        // Send an update to the renderer if a window exists
        if (mb.window !== undefined) {
            ipc.callRenderer<ImageStatusUpdate>(mb.window, PUSH_VIEW_STATUS_CHANGE, {
                viewId,
                status
            })
        }
    }

    /**
     * Set the status of a view to loading.
     *
     * @param viewId - ID of the view
     * @param message - Optional message to pass along
     */
    public static updateViewLoading(viewId: number, message?: string): void {
        ImageStatusManager.updateViewStatus(viewId, {
            state: ImageStatusState.loading,
            message: message ?? 'Loading image'
        })
    }
}
