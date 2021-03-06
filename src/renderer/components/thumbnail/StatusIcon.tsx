import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Tooltip,
    Typography,
    withStyles
} from '@material-ui/core'
import { Moment as MomentType } from 'moment'
import * as React from 'react'
import Moment from 'react-moment'
import styled from 'styled-components'

enum Color {
    green = '#35c522',
    yellow = '#dfb727',
    red = '#ec473b'
}

interface StatusIconDotProps {
    readonly color: Color
}

const StatusIconDot = styled.div<StatusIconDotProps>`
    height: 9px;
    width: 9px;
    background-color: ${props => props.color};
    border-radius: 50%;
    position: absolute;
    top: 7px;
    left: 7px;
    z-index: 1;
    cursor: pointer;
    box-shadow: 0 3px 10px 3px rgba(0, 0, 0, 0.9);
    &:before {
        content: '';
        position: absolute;
        border-radius: 50%;
        width: 200%;
        height: 200%;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
    }
`

const StatusTooltip = withStyles({
    tooltipPlacementBottom: {
        margin: '12px 0'
    }
})(Tooltip)

const PropertyTable = styled.table`
    display: inline-table;
`

const KeyTd = styled.td`
    white-space: nowrap;
    text-align: right;
    padding-right: 3px;
    vertical-align: top;
`

const ValueTd = styled.td`
    text-align: left;
    padding-left: 3px;
    vertical-align: top;
`

interface TableEntryProps {
    name: string
    value: string | React.ReactNode
    explanation?: string
}

const TableEntry: React.FC<TableEntryProps> = props => {
    return (
        <tr>
            <KeyTd>
                <Typography variant="body2">{props.name}:</Typography>
            </KeyTd>
            <ValueTd>
                <Typography variant="body2">{props.value}</Typography>
                {props.explanation && (
                    <Typography variant="caption" color="textSecondary">
                        {props.explanation}
                    </Typography>
                )}
            </ValueTd>
        </tr>
    )
}

interface StatusDialogProps {
    visible: boolean
    onClickDone: (event: React.MouseEvent) => void
    title: string
    extraInfo?: string
    children: React.ReactNode
}

const StatusDialog: React.FC<StatusDialogProps> = props => {
    return (
        <Dialog
            open={props.visible}
            style={{ userSelect: 'none', textAlign: 'center' }}
            onClick={event => event.stopPropagation()}
        >
            <DialogContent>
                <Typography variant="h6">{props.title}</Typography>
                {props.extraInfo !== undefined && (
                    <Typography variant="caption" color="textSecondary">
                        {props.extraInfo}
                    </Typography>
                )}
                <Box my={1}>
                    <PropertyTable>
                        <tbody>{props.children}</tbody>
                    </PropertyTable>
                </Box>
                <DialogActions>
                    <Button
                        style={{ margin: '0 auto' }}
                        onClick={event => props.onClickDone(event)}
                    >
                        Done
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}

enum StatusType {
    nominal = 'Nominal',
    backup = 'Backup mode',
    failed = 'Failed'
}

const StatusToColor = {
    [StatusType.nominal]: Color.green,
    [StatusType.backup]: Color.yellow,
    [StatusType.failed]: Color.red
}

const statusExplanations = {
    [StatusType.nominal]: undefined,
    [StatusType.backup]:
        'A live image is currently unavailable, so one from a previous day is being shown instead.',
    [StatusType.failed]:
        'Failed to download the thumbnail (and likely the full sized image) for this view.'
}

interface StatusProps {
    viewTitle: string
    viewDescription?: string
    isBackup?: boolean
    downloaded?: MomentType
    imageTaken?: MomentType
    updateInterval: number
    failed?: boolean
    onHover: () => void
}

/**
 * Generate a summary description of the view status for the tooltip.
 *
 * @param updateInterval - How often the image is updated in seconds
 * @param isBackup - Whether the image is a backup image
 * @param downloaded - When the full sized image was last downloaded
 * @param imageTaken - When the image was taken
 * @param failed - Whether the thumbnail failed to download
 * @returns Summary description
 */
function statusSummary(
    updateInterval: number,
    isBackup?: boolean,
    downloaded?: MomentType,
    imageTaken?: MomentType,
    failed?: boolean
): string {
    if (failed === true) {
        return 'Failed to update view'
    }
    if (isBackup === undefined) {
        if (downloaded !== undefined) {
            return `Downloaded ${downloaded.fromNow()}`
        }
        return `Updates every ${(updateInterval / 60).toFixed(0)} minutes`
    }
    if (isBackup === true) {
        if (imageTaken !== undefined) {
            return `Backup image taken ${imageTaken.fromNow()}`
        }
        return 'Backup image from a pervious day'
    }
    if (imageTaken !== undefined) {
        return `Image taken ${imageTaken.fromNow()}`
    }
    return 'Up to date imagery'
}

export interface StatusState {
    visible: boolean
}

export default class StatusIconAndDialog extends React.Component<StatusProps, StatusState> {
    constructor(props: StatusProps) {
        super(props)

        this.state = {
            visible: false
        }
    }

    public render(): React.ReactNode {
        const {
            viewTitle,
            viewDescription,
            isBackup,
            downloaded,
            imageTaken,
            updateInterval,
            failed,
            onHover
        } = this.props
        let status: StatusType
        if (failed === true) {
            status = StatusType.failed
        } else {
            status = isBackup === true ? StatusType.backup : StatusType.nominal
        }
        return (
            <>
                <StatusTooltip
                    title={
                        <div>
                            <Typography variant="caption">
                                {statusSummary(
                                    updateInterval,
                                    isBackup,
                                    downloaded,
                                    imageTaken,
                                    failed
                                )}
                            </Typography>
                            <br />
                            <Typography variant="caption">Click for more info</Typography>
                        </div>
                    }
                    placement="bottom"
                    arrow
                >
                    <StatusIconDot
                        onClick={event => {
                            event.stopPropagation()
                            this.setState(state => ({ visible: !state.visible }))
                            onHover()
                        }}
                        onMouseOver={() => onHover()}
                        onFocus={() => undefined}
                        color={StatusToColor[status]}
                    />
                </StatusTooltip>
                <StatusDialog
                    visible={this.state.visible}
                    onClickDone={event => {
                        event.stopPropagation()
                        this.setState({ visible: false })
                    }}
                    title={viewTitle}
                    extraInfo={viewDescription}
                >
                    <TableEntry
                        name="Status"
                        value={status}
                        explanation={statusExplanations[status]}
                    />
                    {downloaded !== undefined && (
                        <TableEntry
                            name="Image downloaded"
                            value={<Moment date={downloaded} fromNow />}
                        />
                    )}
                    {imageTaken !== undefined && (
                        <TableEntry
                            name="Image taken"
                            value={<Moment date={imageTaken} fromNow />}
                        />
                    )}
                    <TableEntry
                        name="Updates every"
                        value={`${(updateInterval / 60).toFixed(0)} minutes`}
                    />
                </StatusDialog>
            </>
        )
    }
}
