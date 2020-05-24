import * as React from 'react';
import { Component } from 'react';
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

interface ImageContainerProps {
    readonly isSelected: boolean
}

const ImageContainer = styled.div<ImageContainerProps>`
    padding: 10px;
    box-shadow: ${props => props.theme.elevation.low.boxShadow};
    border-radius: 5px;
    background-color: ${props => props.theme.elevation.low.backgroundColor};
    border: ${props => props.isSelected ? `4px solid ${props.theme.colors.borderHighlight}` : ''};
`;

interface ThumbnailProps {
    src: string
    name: string
}

interface ThumbnailState {
    isSelected: boolean
}

class Thumbnail extends Component<ThumbnailProps, ThumbnailState> {
    constructor(props: ThumbnailProps) {
        super(props);
        this.state = {
            isSelected: false
        };

        this.toggleSelected = this.toggleSelected.bind(this);
    }

    toggleSelected() {
        this.setState(state => ({ isSelected: !state.isSelected }));
    };

    render() {
        return (
            <ImageContainer isSelected={this.state.isSelected} onClick={() => this.toggleSelected()}>
                <ThumbnailContainer>
                    <Image src={this.props.src} />
                </ThumbnailContainer>
                <ImageName>
                    {this.props.name}
                </ImageName>
            </ImageContainer>
        );
    }
}

export default Thumbnail;
