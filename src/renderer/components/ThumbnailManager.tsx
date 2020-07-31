import Axios from 'axios'
import * as React from 'react'
import { ReactNode } from 'react'

import {
    GET_SATELLITE_CONFIG_CHANNEL,
    GetSatelliteConfigIpcResponse,
    IpcParams,
    IpcResponse
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
    selectedId?: string
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
    }

    async componentDidMount(): Promise<void> {
        const response = await ipcRequest<IpcParams, GetSatelliteConfigIpcResponse>(
            GET_SATELLITE_CONFIG_CHANNEL,
            {}
        )
        this.setState({ satelliteConfig: response.config })
    }

    /**
     * Action to perform when new image is selected.
     * @param imageId - ID of the selected image
     */
    onSelectImage(imageId: string): void {
        if (this.state.selectedId === imageId) {
            return
        }
        this.setState({ selectedId: imageId })
    }

    /**
     * Get thumbnail information for the current config.
     */
    getThumbnailInformation(): ThumbnailInformation[] {
        if (this.state.satelliteConfig === undefined) {
            return []
        }
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

    public render(): ReactNode {
        return (
            <ThumbnailsContainer>
                {this.getThumbnailInformation().map(image => (
                    <Thumbnail
                        id={image.imageId.toString()}
                        src={image.url}
                        name={image.name}
                        isSelected={(id: string) => id === this.state.selectedId}
                        onClick={(id: string) => this.onSelectImage(id)}
                        key={image.imageId}
                    />
                ))}
            </ThumbnailsContainer>
        )
    }
}
