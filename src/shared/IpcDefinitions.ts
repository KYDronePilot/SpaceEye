// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IpcParams {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IpcResponse {}

export interface IpcRequest<P extends IpcParams> {
    params: P
    responseChannel: string
}

export type CloseApplicationIpcParams = IpcParams
export type CloseApplicationIpcResponse = IpcResponse
export const CLOSE_APPLICATION_CHANNEL = 'CLOSE_APPLICATION_CHANNEL'

export interface ExampleIpcParams {
    testP: string
}

export interface ExampleIpcResponse {
    testR: string
}

export const EXAMPLE_CHANNEL = 'EXAMPLE_CHANNEL'
