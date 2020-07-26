import { IpcRenderer } from 'electron'
import moment from 'moment'

import { IpcParams, IpcRequest, IpcResponse } from '../shared/IpcDefinitions'

let ipcRenderer: IpcRenderer | undefined

/**
 * Initialize the IPC renderer.
 */
function initializeIpcRenderer() {
    if (!window?.process || !window?.require) {
        throw new Error('Unable to require renderer process')
    }
    ipcRenderer = window.require('electron').ipcRenderer
}

/**
 * Generate the response channel ID to send to the main process.
 * @param channelId - Request channel ID
 * @returns Response channel ID
 */
function generateResponseChannel(channelId: string): string {
    return `${channelId}_${moment().valueOf()}`
}

/**
 * For making IPC requests.
 * @param id - Channel ID
 * @param params - Request parameters
 * @param wait - Whether to wait for a response
 */
export async function ipcRequest<P extends IpcParams, R extends IpcResponse>(
    id: string,
    params: P,
    wait = true
): Promise<R> {
    if (ipcRenderer === undefined) {
        initializeIpcRenderer()
    }
    const request: IpcRequest<P> = {
        responseChannel: generateResponseChannel(id),
        params
    }
    ipcRenderer!.send(id, request)

    return new Promise(resolve => {
        // Resolve immediately if we don't care about the response
        if (!wait) {
            resolve()
        }
        ipcRenderer!.once(request.responseChannel, (_, response) => resolve(response))
    })
}
