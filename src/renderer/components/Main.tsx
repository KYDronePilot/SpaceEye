import 'typeface-roboto/index.css'

import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import { DarkTheme } from '../themes'
import HeaderBar from './HeaderBar'
import ThumbnailManager from './ThumbnailManager'

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

function Main() {
    return (
        <ThemeProvider theme={DarkTheme}>
            <Container>
                <HeaderBar />
                <ThumbnailManager />
                {/* <Toolbar /> */}
            </Container>
        </ThemeProvider>
    )
}

export default Main
