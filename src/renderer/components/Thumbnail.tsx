import * as React from 'react'
import styled from 'styled-components'

interface IsSelectedStyleProps {
    readonly isSelected: boolean
}

/**
 * Styling for the image itself.
 */
const Image = styled.img`
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;
`

/**
 * Clickable container which the image is in.
 */
const ImageContainer = styled.div<IsSelectedStyleProps>`
    --width: 200px;
    width: var(--width);
    height: calc((var(--width) * 3) / 5);
    background-color: black;
    border-radius: var(--image-border-radius);
    box-shadow: ${props => (!props.isSelected ? '0 3px 10px rgba(0, 0, 0, 0.3)' : 'none')};
    transition: box-shadow var(--transition-time);
    overflow: hidden;
`

/**
 * Background of the image container which acts as a border.
 */
const ImageContainerBackground = styled.div<IsSelectedStyleProps>`
    background: ${props => (props.isSelected ? props.theme.colors.borderHighlight : 'transparent')};
    border-radius: var(--image-border-radius);
    padding: 4px;
    box-shadow: ${props => (props.isSelected ? '0 3px 20px rgba(0, 0, 0, 0.5)' : 'none')};
    transition: box-shadow var(--transition-time), background-color var(--transition-time);
    cursor: ${props => (props.isSelected ? 'default' : 'pointer')};
`

/**
 * Name describing the thumbnail.
 */
const ThumbnailName = styled.p<IsSelectedStyleProps>`
    font-family: Roboto, sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 0.15px;
    margin-bottom: 8px;
    text-shadow: ${props =>
        !props.isSelected ? '0 3px 10px rgba(0, 0, 0, 0.4)' : '0 3px 20px rgba(0, 0, 0, 1)'};
`

/**
 * Container for the image and name.
 */
const ThumbnailContainer = styled.div<IsSelectedStyleProps>`
    --transition-time: 200ms;
    --image-border-radius: 10px;
    padding: 10px;
    transform: ${props => (props.isSelected ? 'scale(1.03)' : '')};
    transition: transform var(--transition-time);
    user-select: none;
`

interface ThumbnailProps {
    id: string
    src: string
    name: string
    isSelected: (id: string) => boolean
    onClick: (id: string) => void
}

const Thumbnail: React.FunctionComponent<ThumbnailProps> = props => {
    const { id, src, name, isSelected, onClick } = props
    const isSelectedValue = isSelected(id)

    return (
        <ThumbnailContainer isSelected={isSelectedValue}>
            <ImageContainerBackground isSelected={isSelectedValue}>
                <ImageContainer isSelected={isSelectedValue} onClick={() => onClick(id)}>
                    <Image src={src} />
                </ImageContainer>
            </ImageContainerBackground>
            <ThumbnailName isSelected={isSelectedValue}>{name}</ThumbnailName>
        </ThumbnailContainer>
    )
}

export default Thumbnail
