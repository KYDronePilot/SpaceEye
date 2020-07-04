import * as React from 'react'
import styled from 'styled-components'

interface WallpaperModeSelectorProps {}

const ModeButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
`

const ModeButton = styled.button`
    display: inline-block;
    border: 2px solid ${props => props.theme.colors.borderHighlight};
    appearance: none;
    background-color: transparent;
    color: ${props => props.theme.colors.borderHighlight};
    text-decoration: none;
    border-radius: 5px;
    margin-right: 10px;
    font-size: 15pt;
    opacity: 1;
    z-index: 15;
`

const WallpaperModeSelector: React.FunctionComponent<WallpaperModeSelectorProps> = props => {
    return (
        <ModeButtonContainer>
            <ModeButton>Different Backgrounds</ModeButton>
        </ModeButtonContainer>
    )
}

export default WallpaperModeSelector
