import { Box, CircularProgress, Grid, Typography } from '@material-ui/core'
import { ipcRenderer as ipc } from 'electron-better-ipc'
import * as React from 'react'
import { ReactNode } from 'react'
import styled from 'styled-components'

import { RootSatelliteConfig } from '../../shared/config_types'
import {
    GET_CURRENT_VIEW_CHANNEL,
    GET_SATELLITE_CONFIG_CHANNEL,
    SET_WALLPAPER_CHANNEL,
    VISIBILITY_CHANGE_ALERT_CHANNEL
} from '../../shared/IpcDefinitions'
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
    cancelVisibilityChangeSub?: () => void
}

const ContentContainer = styled.div`
    position: absolute;
    top: var(--header-height);
    left: 0;
    width: 100%;
    height: calc(100vh - var(--header-height));
    user-select: none;
`

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
        const cancel = ipc.answerMain<boolean>(VISIBILITY_CHANGE_ALERT_CHANNEL, visible => {
            if (visible) {
                this.update()
            }
        })
        this.setState({ cancelVisibilityChangeSub: cancel })
        await this.update()
    }

    async componentWillUnmount(): Promise<void> {
        if (this.state.cancelVisibilityChangeSub !== undefined) {
            this.state.cancelVisibilityChangeSub()
        }
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
        await ipc.callMain<number, void>(SET_WALLPAPER_CHANNEL, viewId)
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
            ipc.callMain<void, RootSatelliteConfig>(GET_SATELLITE_CONFIG_CHANNEL),
            ipc.callMain<void, number>(GET_CURRENT_VIEW_CHANNEL)
        ])
        this.setState({
            satelliteConfig: configResponse,
            selectedId: currentViewResponse
        })
    }

    public render(): ReactNode {
        // Show loading symbol if config not loaded
        if (!this.state.satelliteConfig) {
            return (
                <ContentContainer>
                    <Box my={25} />
                    <Box mx={7}>
                        <Grid
                            container
                            direction="column"
                            alignContent="center"
                            alignItems="center"
                        >
                            <CircularProgress />
                            <Box my={1} />
                            <Typography variant="body1" color="textSecondary">
                                Loading satellite config
                            </Typography>
                        </Grid>
                    </Box>
                </ContentContainer>
            )
        }

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
