import * as React from 'react';
import { Component } from 'react';
import styled from 'styled-components';
import Thumbnails from './Thumbnails';

const Container = styled.div`
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    left: 0;
    background: #343434;
    color: white;
    display: flex;
    flex-direction: column;
`

class Main extends Component {
    render() {
        return (
            <Container>
                <Thumbnails>
                </Thumbnails>
            </Container>
        );
    }
}

export default Main;
