import * as React from 'react'
import styled from 'styled-components'
import { ipcRenderer } from 'electron'

interface CloseButtonProps {}

const CloseIconSvg = styled.svg`
    --size: 8px;
    width: var(--size);
    height: var(--size);
    fill: var(--close-icon-color);
    &:hover {
        fill: var(--close-icon-color);
    }
`

const CloseIconImageContainer = styled.div`
    display: inline-block;
    padding: 3px 10px;
    --close-icon-color: #c7c7c7;
    &:hover {
        --close-icon-color: white;
    }
    -webkit-app-region: no-drag;
`

/**
 * Close the application window.
 */
function closeWindow() {
    ipcRenderer.send('close_windows')
}

const CloseButton: React.FunctionComponent<CloseButtonProps> = props => {
    return (
        <div>
            <CloseIconImageContainer onClick={closeWindow}>
                <CloseIconSvg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    viewBox="0 0 96 96"
                    enable-background="new 0 0 96 96"
                >
                    <polygon points="96,14 82,0 48,34 14,0 0,14 34,48 0,82 14,96 48,62 82,96 96,82 62,48 " />
                </CloseIconSvg>
            </CloseIconImageContainer>
        </div>
    )
}

export default CloseButton
