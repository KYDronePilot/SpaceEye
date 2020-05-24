import * as React from 'react';
import {Component} from 'react';
import styled from 'styled-components';
import SimpleBar from 'simplebar-react';
import axios from 'axios';
import Thumbnail from './Thumbnail';

import 'simplebar/dist/simplebar.min.css';

const Container = styled.div`
    flex-grow: 1;
    height: var(--thumbnails-height);
`;

const ThumbnailSimpleBar = styled(SimpleBar)`
    height: 100%;
    margin-right: 2px;

    .simplebar-scrollbar::before {
        background-color: rgb(90, 90, 90);
        margin-top: var(--header-height);
    }
`;

const ThumbnailGrid = styled.div`
    --x-padding: 20px;
    --y-padding: 50px;
    padding-left: var(--y-padding);
    padding-right: var(--y-padding);
    padding-top: calc(var(--x-padding) + var(--header-height));
    background-color: var(--background-color);
    display: grid;
    max-width: 100%;
    grid-auto-flow: row;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 20px;
    justify-items: center;
    text-align: center;
    height: max-content;
`;

interface URLImageTypes {
    tiny: string
    small: string
    large: string
    full: string
}

interface ImageData {
    name: string
    spacecraft: string
    interval: number
    aspect: number
    url: URLImageTypes
}

interface DownlinkSourcesResponse {
    sources: ImageData[]
}

interface ThumbnailsState {
    images: ImageData[]
}

class Thumbnails extends Component<{}, ThumbnailsState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            images: []
        }
    }

    componentDidMount() {
        axios.get<DownlinkSourcesResponse>('https://downlinkapp.com/sources.json')
            .then(res => {
                this.setState({images: res.data.sources})
            })
    }

    render() {
        return (
            <Container>
                <ThumbnailSimpleBar>
                    <ThumbnailGrid>
                        {this.state.images.map(image => (
                            <Thumbnail src={image.url.small} key={image.name} />
                        ))}
                    </ThumbnailGrid>
                </ThumbnailSimpleBar>
            </Container>
        );
    }
}

export default Thumbnails;
