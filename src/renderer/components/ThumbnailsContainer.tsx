import 'simplebar/dist/simplebar.min.css'

import { ReactNode } from 'react'
import * as React from 'react'
import SimpleBar from 'simplebar-react'
import styled from 'styled-components'

/**
 * Fixed-size container which the thumbnail are in.
 */
const ViewContainer = styled.div`
    flex-grow: 1;
    height: var(--thumbnails-height);
`

/**
 * Scrollable container for the thumbnails.
 */
const ScrollableContainer = styled(SimpleBar)`
    height: 100%;
    margin-right: 2px;

    .simplebar-scrollbar::before {
        background-color: rgb(90, 90, 90);
        margin-top: var(--header-height);
    }
`

/**
 * Grid of thumbnails.
 */
const ThumbnailGrid = styled.div`
    --x-padding: 50px;
    --y-padding: 10px;
    padding: calc(var(--y-padding) + var(--header-height)) var(--x-padding) var(--y-padding);
    background-color: var(--background-color);
    display: grid;
    max-width: 100%;
    grid-auto-flow: row;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 20px;
    justify-items: center;
    text-align: center;
    height: max-content;
`

interface ThumbnailsContainerProps {
    children: ReactNode
}

export const ThumbnailsContainer: React.FunctionComponent<ThumbnailsContainerProps> = props => {
    return (
        <ViewContainer>
            <ScrollableContainer>
                <ThumbnailGrid>{props.children}</ThumbnailGrid>
            </ScrollableContainer>
        </ViewContainer>
    )
}
