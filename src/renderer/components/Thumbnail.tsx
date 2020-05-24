import * as React from 'react';
import styled from 'styled-components';

const ImageContainer = styled.div`
    --width: 200px;
    width: var(--width);
    height: calc((var(--width) * 9) / 16);
    //display: flex;
    //flex-direction: column;
    //justify-content: center;
    //align-items: center;
    background-color: black;
    border-radius: 10px;
    box-shadow: ${props => props.theme.elevation.low.boxShadow};
    //border-color: black;
    //border-style: solid;
    //border-width: 5px;
`

const Image = styled.img`
    max-width: 100%;
    max-height: 100%;
`

interface ThumbnailProps {
    src: string
}

function Thumbnail(props: ThumbnailProps) {
    return (
        <ImageContainer>
            <Image src={props.src} />
        </ImageContainer>
    );
}

export default Thumbnail;
