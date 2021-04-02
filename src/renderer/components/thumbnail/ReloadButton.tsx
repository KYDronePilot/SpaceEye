import { IconButton, withStyles } from '@material-ui/core'
import RefreshIcon from '@material-ui/icons/Refresh'
import * as React from 'react'

const ReloadButtonComp = withStyles({
    root: {
        position: 'absolute',
        top: '4px',
        right: '4px',
        'z-index': '1',
        transform: 'scale(0.70)',
        padding: '0'
    }
})(IconButton)

const DROP_SHADOW = `drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))
 drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))
 drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))`

const ImageReloadIcon = withStyles({
    root: {
        filter: DROP_SHADOW
    }
})(RefreshIcon)

interface ReloadButtonProps {
    onClick: () => void
}

const ReloadButton: React.FC<ReloadButtonProps> = props => {
    return (
        <ReloadButtonComp
            id="reload-icon"
            onClick={event => {
                event.stopPropagation()
                props.onClick()
            }}
        >
            <ImageReloadIcon />
        </ReloadButtonComp>
    )
}

export default ReloadButton
