import * as React from 'react'
import styled from 'styled-components'

interface WallpaperModeSelectorProps {}

/**
 * Flex container for making the button vertically centered.
 */
const ModeButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`

/**
 * Actual button.
 */
const ModeButton = styled.button`
    display: inline-block;
    border: 1.2px solid rgb(0, 112, 255);
    appearance: none;
    background-color: transparent;
    color: rgb(0, 112, 255);
    text-decoration: none;
    border-radius: 5px;
    margin-right: 10px;
    font-size: 13pt;
    font-weight: normal;
    outline: none;
    -webkit-app-region: no-drag;
`

const WallpaperModeSelector: React.FunctionComponent<WallpaperModeSelectorProps> = props => {
    return (
        <ModeButtonContainer>
            <ModeButton>Different Backgrounds</ModeButton>
        </ModeButtonContainer>
    )
}

export default WallpaperModeSelector
