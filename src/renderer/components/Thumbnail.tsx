import * as React from 'react';
import styled from 'styled-components';

const ThumbnailContainer = styled.div`
    --width: 200px;
    width: var(--width);
    height: calc((var(--width) * 9) / 16);
    background-color: black;
    border-radius: 10px;
`;

const Image = styled.img`
    max-width: 100%;
    max-height: 100%;
`;

const ImageName = styled.p`
    font-family: Roboto, sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 0.15px;
    margin-bottom: 8px;
`;

const ImageContainer = styled.div`
    padding: 10px;
    box-shadow: ${props => props.theme.elevation.low.boxShadow};
    border-radius: 5px;
    background-color: ${props => props.theme.elevation.low.backgroundColor};
    border: 4px solid ${props => props.theme.colors.borderHighlight};
`;

interface ThumbnailProps {
    src: string
    name: string
}

function Thumbnail(props: ThumbnailProps) {
    return (
        <ImageContainer>
            <ThumbnailContainer>
                <Image src={props.src} />
            </ThumbnailContainer>
            <ImageName>
                {props.name}
            </ImageName>
        </ImageContainer>
    );
}

export default Thumbnail;
