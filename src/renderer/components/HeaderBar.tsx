import * as React from 'react'
import styled from 'styled-components'
import 'typeface-roboto/index.css'
import CloseButton from './CloseButton'
import WallpaperModeSelector from './WallpaperModeSelector'

/**
 * Blurs the background when scrolling.
 *
 * At a lower z-index than the actual header.
 */
const HeaderBlur = styled.div`
    height: var(--header-height);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    backdrop-filter: blur(15px);
    z-index: 9;
`

/**
 * Element inside of the blur element to add a color tinting.
 */
const HeaderBlurColorFilter = styled.div`
    background-color: ${props => props.theme.colors.headerBackground};
    opacity: 0.5;
    width: 100%;
    height: 100%;
`

/**
 * The actual header container, which floats above the blur.
 */
const FloatingHeader = styled.div`
    height: var(--header-height);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    display: flex;
    -webkit-app-region: drag;
`

/**
 * A flexbox spacer.
 */
const FlexSpacer = styled.div`
    flex-grow: 1;
`

function HeaderBar() {
    return (
        <>
            <HeaderBlur>
                <HeaderBlurColorFilter />
            </HeaderBlur>
            <FloatingHeader>
                <CloseButton />
                <FlexSpacer />
                <WallpaperModeSelector />
            </FloatingHeader>
        </>
    )
}

export default HeaderBar
