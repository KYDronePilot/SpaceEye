import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import Thumbnails from './Thumbnails'
import { DarkTheme } from '../themes'
import 'typeface-roboto/index.css'
import CloseButton from './CloseButton'
import WallpaperModeSelector from './WallpaperModeSelector'

const Container = styled.div`
    --header-height: 50px;
    --thumbnails-height: calc(100vh - var(--toolbar-height));
    --toolbar-height: 0.001px;
    --background-color: ${props => props.theme.colors.background};
    --font-color: ${props => props.theme.colors.foreground};
    color: var(--font-color);
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    background-color: var(--background-color);
    display: flex;
    flex-direction: column;
`

const HeaderContainer = styled.div`
    height: var(--header-height);
    -webkit-app-region: drag;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    backdrop-filter: blur(25px);
    z-index: 10;
`

const HeaderBlur = styled.div`
    background-color: ${props => props.theme.colors.headerBackground};
    opacity: 0.5;
    width: 100%;
    height: 100%;
    display: flex;
`

const FlexSpacer = styled.div`
    flex-grow: 1;
`

function Main() {
    return (
        <ThemeProvider theme={DarkTheme}>
            <Container>
                <HeaderContainer>
                    <HeaderBlur>
                        <CloseButton />
                        <FlexSpacer />
                        <WallpaperModeSelector />
                    </HeaderBlur>
                </HeaderContainer>
                <Thumbnails />
                {/* <Toolbar /> */}
            </Container>
        </ThemeProvider>
    )
}

export default Main
