import { ipcRenderer } from 'electron'
import * as React from 'react'
import { ReactNode } from 'react'

import {
    GET_CURRENT_VIEW_CHANNEL,
    GET_SATELLITE_CONFIG_CHANNEL,
    GetCurrentViewIpcResponse,
    GetSatelliteConfigIpcResponse,
    IpcParams,
    IpcResponse,
    SET_WALLPAPER_CHANNEL,
    SetWallpaperIpcParams,
    VISIBILITY_CHANGE_ALERT_CHANNEL,
    VisibilityChangeAlertIpcParams
} from '../../shared/IpcDefinitions'
import { ipcRequest } from '../IpcService'
import Thumbnail from './Thumbnail'
import { ThumbnailsContainer } from './ThumbnailsContainer'

/**
 * Information about a thumbnail to display.
 */
interface ThumbnailInformation {
    satelliteId: number
    viewId: number
    imageId: number
    name: string
    url: string
    dimensions: [number, number]
}

export interface ThumbnailManagerState {
    satelliteConfig?: RootSatelliteConfig
    selectedId?: number
}

export default class ThumbnailManager extends React.Component<
    Record<string, unknown>,
    ThumbnailManagerState
> {
    constructor(props: Record<string, unknown>) {
        super(props)

        this.state = {
            satelliteConfig: undefined,
            selectedId: undefined
        }

        this.onSelectImage = this.onSelectImage.bind(this)
        this.getThumbnailInformation = this.getThumbnailInformation.bind(this)
        this.update = this.update.bind(this)
    }

    async componentDidMount(): Promise<void> {
        ipcRenderer.on(
            VISIBILITY_CHANGE_ALERT_CHANNEL,
            (_, params: VisibilityChangeAlertIpcParams) => {
                if (params.visible) {
                    this.update()
                }
            }
        )
        await this.update()
    }

    /**
     * Action to perform when new image is selected.
     *
     * @param viewId - ID of the selected image
     */
    async onSelectImage(viewId: number): Promise<void> {
        if (this.state.selectedId === viewId) {
            return
        }
        this.setState({ selectedId: viewId })
        await ipcRequest<SetWallpaperIpcParams, IpcResponse>(SET_WALLPAPER_CHANNEL, { viewId })
    }

    /**
     * Get thumbnail information for the current config.
     */
    getThumbnailInformation(): ThumbnailInformation[] {
        if (this.state.satelliteConfig === undefined) {
            return []
        }
        const timestamp = new Date().getTime()
        const thumbnails: ThumbnailInformation[] = []

        for (const satellite of this.state.satelliteConfig.satellites) {
            for (const view of satellite.views) {
                for (const imageSource of view.imageSources) {
                    if (imageSource.isThumbnail) {
                        thumbnails.push({
                            satelliteId: satellite.id,
                            viewId: view.id,
                            imageId: imageSource.id,
                            name: `${satellite.name} - ${view.name}`,
                            url: imageSource.url,
                            dimensions: imageSource.dimensions
                        })
                    }
                }
            }
        }
        return thumbnails
    }

    /**
     * Update the satellite config, thumbnails, and current view.
     */
    async update(): Promise<void> {
        const [configResponse, currentViewResponse] = await Promise.all([
            ipcRequest<IpcParams, GetSatelliteConfigIpcResponse>(GET_SATELLITE_CONFIG_CHANNEL, {}),
            ipcRequest<IpcParams, GetCurrentViewIpcResponse>(GET_CURRENT_VIEW_CHANNEL, {})
        ])
        this.setState({
            satelliteConfig: configResponse.config,
            selectedId: currentViewResponse.viewId
        })
    }

    public render(): ReactNode {
        return (
            <ThumbnailsContainer>
                {this.getThumbnailInformation().map(image => (
                    <Thumbnail
                        id={image.viewId}
                        src={image.url}
                        name={image.name}
                        isSelected={(id: number) => id === this.state.selectedId}
                        onClick={(id: number) => this.onSelectImage(id)}
                        key={image.viewId}
                    />
                ))}
            </ThumbnailsContainer>
        )
    }
}
