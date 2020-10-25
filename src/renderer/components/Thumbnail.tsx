import { Grid, LinearProgress, Typography } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'
import { ipcRenderer } from 'electron'
import electronLog from 'electron-log'
import moment, { Moment } from 'moment'
import * as React from 'react'
import styled from 'styled-components'

import {
    DOWNLOAD_THUMBNAIL_CHANNEL,
    DownloadThumbnailIpcParams,
    DownloadThumbnailIpcResponse,
    VISIBILITY_CHANGE_ALERT_CHANNEL,
    VisibilityChangeAlertIpcParams
} from '../../shared/IpcDefinitions'
import { ipcRequest } from '../IpcService'

ipcRenderer.setMaxListeners(30)
const log = electronLog.scope('thumbnail-component')

interface IsSelectedStyleProps {
    readonly isSelected: boolean
}

/**
 * Styling for the image itself.
 */
const Image = styled.img`
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;
`

/**
 * Clickable container which the image is in.
 */
const ImageContainer = styled.div<IsSelectedStyleProps>`
    --width: 200px;
    --height: calc((var(--width) * 3) / 5);
    width: var(--width);
    height: var(--height);
    background-color: black;
    border-radius: var(--image-border-radius);
    box-shadow: ${props => (!props.isSelected ? '0 3px 10px rgba(0, 0, 0, 0.3)' : 'none')};
    transition: box-shadow var(--transition-time);
    overflow: hidden;
    position: relative;
`

/**
 * Background of the image container which acts as a border.
 */
const ImageContainerBackground = styled.div<IsSelectedStyleProps>`
    background: ${props => (props.isSelected ? props.theme.colors.borderHighlight : 'transparent')};
    border-radius: var(--image-border-radius);
    padding: 4px;
    box-shadow: ${props => (props.isSelected ? '0 3px 20px rgba(0, 0, 0, 0.5)' : 'none')};
    transition: box-shadow var(--transition-time), background-color var(--transition-time);
    cursor: ${props => (props.isSelected ? 'default' : 'pointer')};
`

/**
 * Name describing the thumbnail.
 */
const ThumbnailName = styled.p<IsSelectedStyleProps>`
    font-family: Roboto, sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 0.15px;
    margin-bottom: 8px;
    text-shadow: ${props =>
        !props.isSelected ? '0 3px 10px rgba(0, 0, 0, 0.4)' : '0 3px 20px rgba(0, 0, 0, 1)'};
`

/**
 * Container for the image and name.
 */
const ThumbnailContainer = styled.div<IsSelectedStyleProps>`
    --transition-time: 200ms;
    --image-border-radius: 10px;
    padding: 10px;
    transform: ${props => (props.isSelected ? 'scale(1.03)' : '')};
    transition: transform var(--transition-time);
    user-select: none;
`

enum ThumbnailLoadingState {
    loading,
    loaded,
    failed
}

const BottomProgress = styled(LinearProgress)`
    margin-top: calc(var(--height) - 4.12px);
`

const VerticalCenterContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`

interface ImageSwitcherProps {
    src: string
    loadingState: ThumbnailLoadingState
}

// eslint-disable-next-line consistent-return
const ImageSwitcher: React.FC<ImageSwitcherProps> = props => {
    const { src, loadingState } = props
    // eslint-disable-next-line default-case
    switch (loadingState) {
        case ThumbnailLoadingState.loading:
            return <BottomProgress />
        case ThumbnailLoadingState.loaded:
            return <Image src={src} />
        case ThumbnailLoadingState.failed:
            return (
                <VerticalCenterContainer>
                    <Grid container direction="column" alignItems="center">
                        <ErrorIcon color="disabled" fontSize="large" />
                        <Typography variant="body2" color="textSecondary">
                            Error downloading
                        </Typography>
                    </Grid>
                </VerticalCenterContainer>
            )
    }
}

interface CachedImage {
    dataUrl: string
    expiration: Moment
}

interface ThumbnailProps {
    id: number
    src: string
    name: string
    isSelected: (id: number) => boolean
    onClick: (id: number) => void
}

interface ThumbnailState {
    b64Image?: string
    loadingState: ThumbnailLoadingState
}

const thumbnailCache: { [key: number]: CachedImage } = {}

export default class Thumbnail extends React.Component<ThumbnailProps, ThumbnailState> {
    updateLock: boolean

    constructor(props: ThumbnailProps) {
        super(props)

        this.state = {
            loadingState: ThumbnailLoadingState.loading
        }

        this.update = this.update.bind(this)
        this.updateLock = false
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

    async update(): Promise<void> {
        // Don't allow concurrent updates for the same instance
        if (this.updateLock) {
            return
        }
        this.updateLock = true

        if (this.props.id in thumbnailCache) {
            // If cached image is still in date, use it
            const cachedImage = thumbnailCache[this.props.id]
            if (moment.utc().diff(cachedImage.expiration, 'seconds') < 0) {
                this.setState({
                    b64Image: cachedImage.dataUrl,
                    loadingState: ThumbnailLoadingState.loaded
                })
                return
            }
        }
        // If no image exists, set the loading icon
        if (this.state.b64Image === undefined) {
            this.setState({ loadingState: ThumbnailLoadingState.loading })
        }
        // Fetch a new image and cache it
        const response = await ipcRequest<DownloadThumbnailIpcParams, DownloadThumbnailIpcResponse>(
            DOWNLOAD_THUMBNAIL_CHANNEL,
            { url: this.props.src }
        )
        // If it failed, report and exit
        if (response.dataUrl === undefined) {
            this.setState({ loadingState: ThumbnailLoadingState.failed })
            return
        }
        // If successful, update cache and state
        thumbnailCache[this.props.id] = {
            dataUrl: response.dataUrl,
            expiration: moment(response.expiration)
        }
        this.setState({ loadingState: ThumbnailLoadingState.loaded, b64Image: response.dataUrl })
        this.updateLock = false
    }

    public render(): React.ReactNode {
        const { id, name, isSelected, onClick } = this.props
        const isSelectedValue = isSelected(id)

        return (
            <ThumbnailContainer isSelected={isSelectedValue}>
                <ImageContainerBackground isSelected={isSelectedValue}>
                    <ImageContainer isSelected={isSelectedValue} onClick={() => onClick(id)}>
                        <ImageSwitcher
                            src={this.state.b64Image ?? ''}
                            loadingState={this.state.loadingState}
                        />
                    </ImageContainer>
                </ImageContainerBackground>
                <ThumbnailName isSelected={isSelectedValue}>{name}</ThumbnailName>
            </ThumbnailContainer>
        )
    }
}
