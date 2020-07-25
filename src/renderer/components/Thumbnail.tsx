import * as React from 'react'
import { Component } from 'react'
import styled from 'styled-components'

const ThumbnailContainer = styled.div<ThumbnailContainerProps>`
    --width: 200px;
    width: var(--width);
    height: calc((var(--width) * 3) / 5);
    background-color: black;
    border-radius: 10px;
    box-shadow: ${props => (!props.isSelected ? '0 3px 10px rgba(0, 0, 0, 0.3)' : 'none')};
    // border: 4px solid
    //     ${props => (props.isSelected ? props.theme.colors.borderHighlight : 'transparent')};
    transition: box-shadow 200ms;
    overflow: hidden;
`

const ThumbnailContainerBackground = styled.div<ThumbnailContainerProps>`
    background: ${props => (props.isSelected ? props.theme.colors.borderHighlight : 'transparent')};
    border-radius: 10px;
    padding: 4px 4px;
    box-shadow: ${props => (props.isSelected ? '0 3px 20px rgba(0, 0, 0, 0.5)' : 'none')};
    transition: box-shadow 200ms, background-color 200ms;
    cursor: pointer;
`

const Image = styled.img`
    max-width: 100%;
    max-height: 100%;
`

const ImageName = styled.p<ThumbnailContainerProps>`
    font-family: Roboto, sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 0.15px;
    margin-bottom: 8px;
    text-shadow: ${props =>
        !props.isSelected ? '0 3px 10px rgba(0, 0, 0, 0.4)' : '0 3px 20px rgba(0, 0, 0, 1)'};
`

interface ThumbnailContainerProps {
    readonly isSelected: boolean
}

const ImageContainer = styled.div<ThumbnailContainerProps>`
    padding: 10px;
    // box-shadow: ${props => props.theme.elevation.low.boxShadow};
    border-radius: 5px;
     //background-color: ${props => props.theme.elevation.low.backgroundColor};
     ${props => (props.isSelected ? 'transform: scale(1.03)' : '')};
     transition: transform 200ms;
     user-select: none;
`

interface ThumbnailProps {
    src: string
    name: string
}

interface ThumbnailState {
    isSelected: boolean
}

class Thumbnail extends Component<ThumbnailProps, ThumbnailState> {
    constructor(props: ThumbnailProps) {
        super(props)
        this.state = {
            isSelected: false
        }

        this.toggleSelected = this.toggleSelected.bind(this)
    }

    toggleSelected() {
        this.setState(state => ({ isSelected: !state.isSelected }))
    }

    render() {
        return (
            <ImageContainer isSelected={this.state.isSelected}>
                <ThumbnailContainerBackground isSelected={this.state.isSelected}>
                    <ThumbnailContainer
                        isSelected={this.state.isSelected}
                        onClick={() => this.toggleSelected()}
                    >
                        <Image src={this.props.src} />
                    </ThumbnailContainer>
                </ThumbnailContainerBackground>
                <ImageName isSelected={this.state.isSelected}>{this.props.name}</ImageName>
            </ImageContainer>
        )
    }
}

export default Thumbnail
