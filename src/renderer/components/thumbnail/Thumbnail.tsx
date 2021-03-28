import { Grid, LinearProgress, Typography, withStyles } from '@material-ui/core'
import ErrorIcon from '@material-ui/icons/Error'
import AsyncLock from 'async-lock'
import { ipcRenderer } from 'electron'
import { ipcRenderer as ipc } from 'electron-better-ipc'
import electronLog from 'electron-log'
import moment, { Moment } from 'moment'
import * as React from 'react'
import styled from 'styled-components'

import { DownloadedThumbnailIpc, DownloadThumbnailIpcRequest } from '../../../shared'
import {
    DOWNLOAD_THUMBNAIL_CHANNEL,
    VIEW_DOWNLOAD_PROGRESS,
    VISIBILITY_CHANGE_ALERT_CHANNEL
} from '../../../shared/IpcDefinitions'
import StatusIconAndDialog from './StatusIcon'

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
    position: absolute;
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
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

const BottomProgress = withStyles({
    root: {
        marginTop: 'calc(var(--height) - 6.62px)',
        height: '6.5px'
    },
    colorPrimary: {
        backgroundColor: '#567d2e'
    },
    barColorPrimary: {
        backgroundColor: '#96c267'
    }
})(LinearProgress)

const VerticalCenterContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`

interface ImageSwitcherProps {
    src: string
    loadingState: ThumbnailLoadingState
    downloadingPercentage?: number
}

// eslint-disable-next-line consistent-return
const ImageSwitcher: React.FC<ImageSwitcherProps> = props => {
    const { src, loadingState, downloadingPercentage } = props
    // eslint-disable-next-line default-case
    switch (loadingState) {
        case ThumbnailLoadingState.loading:
            return <BottomProgress />
        case ThumbnailLoadingState.loaded:
            return (
                <>
                    <Image src={src} />
                    {downloadingPercentage !== undefined && (
                        <BottomProgress
                            variant={downloadingPercentage === -1 ? 'indeterminate' : 'determinate'}
                            value={downloadingPercentage}
                        />
                    )}
                </>
            )
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
    isBackup?: boolean
    timeTaken?: number
    etag?: string
}

const lock = new AsyncLock()

interface ThumbnailProps {
    id: number
    src: string
    name: string
    description?: string
    updateInterval: number
    isSelected: (id: number) => boolean
    onClick: (id: number) => void
}

interface ThumbnailState {
    b64Image?: string
    isBackup?: boolean
    timeTaken?: Moment
    loadingState: ThumbnailLoadingState
    cancelVisibilityChangeSub?: () => void
    cancelProgressChangeSub?: () => void
    downloadPercentage?: number
}

const thumbnailCache: { [key: number]: CachedImage | undefined } = {}

export default class Thumbnail extends React.Component<ThumbnailProps, ThumbnailState> {
    constructor(props: ThumbnailProps) {
        super(props)

        this.state = {
            loadingState: ThumbnailLoadingState.loading
        }

        this.updateUnsafe = this.updateUnsafe.bind(this)
        this.update = this.update.bind(this)
    }

    async componentDidMount(): Promise<void> {
        const cancelVisChange = ipc.answerMain<boolean>(
            VISIBILITY_CHANGE_ALERT_CHANNEL,
            visible => {
                if (visible) {
                    this.update()
                }
            }
        )
        const cancelProgressChange = ipc.answerMain<number | undefined>(
            `${VIEW_DOWNLOAD_PROGRESS}_${this.props.id}`,
            percentage => {
                // Delay before resetting to give time for background to change
                if (percentage === undefined) {
                    setTimeout(() => {
                        this.setState({ downloadPercentage: percentage })
                    }, 400)
                } else {
                    this.setState({ downloadPercentage: percentage })
                }
            }
        )
        this.setState({
            cancelVisibilityChangeSub: cancelVisChange,
            cancelProgressChangeSub: cancelProgressChange
        })
        await this.update()
    }

    async componentWillUnmount(): Promise<void> {
        if (this.state.cancelVisibilityChangeSub !== undefined) {
            this.state.cancelVisibilityChangeSub()
        }
        if (this.state.cancelProgressChangeSub !== undefined) {
            this.state.cancelProgressChangeSub()
        }
    }

    /**
     * Update the thumbnail with no concurrent locking mechanism.
     */
    private async updateUnsafe(): Promise<void> {
        const cachedImage = thumbnailCache[this.props.id] ?? undefined
        // If no image in state, try to get from cache
        if (this.state.b64Image === undefined) {
            if (cachedImage !== undefined) {
                // Set the cached image
                this.setState({
                    loadingState: ThumbnailLoadingState.loaded,
                    b64Image: cachedImage.dataUrl,
                    isBackup: cachedImage.isBackup,
                    timeTaken: moment(cachedImage.timeTaken)
                })
            } else {
                // Set the loading animation
                this.setState({
                    loadingState: ThumbnailLoadingState.loading
                })
            }
        }
        // If there's a cached image that's in date, it has already been set; nothing to do
        if (cachedImage !== undefined && moment.utc().diff(cachedImage.expiration, 'seconds') < 0) {
            return
        }
        // Fetch a new image
        const response = await ipc.callMain<DownloadThumbnailIpcRequest, DownloadedThumbnailIpc>(
            DOWNLOAD_THUMBNAIL_CHANNEL,
            { url: this.props.src, etag: cachedImage?.etag }
        )
        const newExpiration = moment(moment.utc().add(5, 'minutes'))
        // If not modified, update expiration and exit
        if (response.isModified === false) {
            ;(cachedImage as CachedImage).expiration = newExpiration
            return
        }
        // If download failed, report and exit
        if (response.dataUrl === undefined) {
            this.setState({ loadingState: ThumbnailLoadingState.failed })
            return
        }
        // Update cache and state
        thumbnailCache[this.props.id] = {
            dataUrl: response.dataUrl,
            expiration: newExpiration,
            etag: response.etag,
            isBackup: response.isBackup,
            timeTaken: response.timeTaken
        }
        this.setState({
            loadingState: ThumbnailLoadingState.loaded,
            b64Image: response.dataUrl,
            isBackup: response.isBackup,
            timeTaken: moment(response.timeTaken)
        })
    }

    /**
     * Update the thumbnail with a locking mechanism.
     */
    async update(): Promise<void> {
        await lock.acquire(this.props.id.toString(), async () => {
            await this.updateUnsafe()
        })
    }

    public render(): React.ReactNode {
        const { id, name, description, isSelected, onClick } = this.props
        const isSelectedValue = isSelected(id)

        return (
            <ThumbnailContainer isSelected={isSelectedValue}>
                <ImageContainerBackground isSelected={isSelectedValue}>
                    <ImageContainer isSelected={isSelectedValue} onClick={() => onClick(id)}>
                        <StatusIconAndDialog
                            viewTitle={name}
                            viewDescription={description}
                            updateInterval={this.props.updateInterval}
                            // downloaded={moment.utc().subtract(12, 'm')}
                            imageTaken={this.state.timeTaken}
                            isBackup={this.state.isBackup}
                            failed={this.state.loadingState === ThumbnailLoadingState.failed}
                        />
                        <ImageSwitcher
                            src={this.state.b64Image ?? ''}
                            loadingState={this.state.loadingState}
                            downloadingPercentage={
                                isSelectedValue ? this.state.downloadPercentage : undefined
                            }
                        />
                    </ImageContainer>
                </ImageContainerBackground>
                <ThumbnailName isSelected={isSelectedValue}>{name}</ThumbnailName>
            </ThumbnailContainer>
        )
    }
}
