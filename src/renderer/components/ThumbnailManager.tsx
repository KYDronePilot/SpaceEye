import Axios from 'axios'
import * as React from 'react'
import { ReactNode } from 'react'

import Thumbnail from './Thumbnail'
import { ThumbnailsContainer } from './ThumbnailsContainer'

/**
 * Downlink URL image types.
 */
interface URLImageTypes {
    tiny: string
    small: string
    large: string
    full: string
}

/**
 * Downlink information about each image.
 */
export interface ImageData {
    name: string
    spacecraft: string
    interval: number
    aspect: number
    url: URLImageTypes
}

/**
 * Downlink JSON response.
 */
interface DownlinkSourcesResponse {
    sources: ImageData[]
}

export interface ThumbnailManagerState {
    images: ImageData[]
    selectedId?: string
}

export default class ThumbnailManager extends React.Component<
    Record<string, unknown>,
    ThumbnailManagerState
> {
    constructor(props: Record<string, unknown>) {
        super(props)

        this.state = {
            images: [],
            selectedId: undefined
        }

        this.onSelectImage = this.onSelectImage.bind(this)
    }

    componentDidMount(): void {
        // Download image manifest
        Axios.get<DownlinkSourcesResponse>('https://downlinkapp.com/sources.json').then(res => {
            this.setState({ images: res.data.sources })
        })
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

    public render(): ReactNode {
        return (
            <ThumbnailsContainer>
                {this.state.images.map(image => (
                    <Thumbnail
                        id={image.name}
                        src={image.url.small}
                        name={image.name}
                        isSelected={(id: string) => id === this.state.selectedId}
                        onClick={(id: string) => this.onSelectImage(id)}
                        key={image.name}
                    />
                ))}
            </ThumbnailsContainer>
        )
    }
}
