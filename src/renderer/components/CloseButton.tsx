import * as React from 'react'
import styled from 'styled-components'

import { CLOSE_APPLICATION_CHANNEL } from '../../shared/IpcDefinitions'
import { ipcRequest } from '../IpcService'

const CloseIconBlock = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 20px;
`

const CloseIconClickableContainer = styled.div`
    --size: 8px;
    width: var(--size);
    height: var(--size);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 5px 5px;
    cursor: pointer;
    --close-icon-color: #c7c7c7;
    &:hover {
        --close-icon-color: white;
    }
    -webkit-app-region: no-drag;
`

const CloseIconSvg = styled.svg`
    width: auto;
    height: auto;
    fill: var(--close-icon-color);
`

/**
 * Close the application window.
 */
async function closeWindow() {
    await ipcRequest(CLOSE_APPLICATION_CHANNEL, {}, false)
}

const CloseButton: React.FunctionComponent = props => {
    return (
        <CloseIconBlock>
            <CloseIconClickableContainer onClick={closeWindow}>
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
            </CloseIconClickableContainer>
        </CloseIconBlock>
    )
}

export default CloseButton
