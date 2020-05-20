import * as React from 'react';
import { Component } from 'react';
import styled from 'styled-components';

const ImageContainer = styled.div`
    width: 144px;
    height: 81px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

const Image = styled.img`
    max-width: 100%;
    max-height: 100%;
`

interface ThumbnailProps {
    src: string
}

class Thumbnail extends Component<ThumbnailProps, {}> {
    render() {
        return (
            <ImageContainer>
                <Image src={this.props.src}/>
            </ImageContainer>
        );
    }
}

export default Thumbnail;
