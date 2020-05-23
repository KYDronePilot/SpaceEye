import * as React from 'react';
import styled from 'styled-components';
import Thumbnails from './Thumbnails';
import Toolbar from './Toolbar';

const Container = styled.div`
    --header-height: 70px;
    --thumbnails-height: calc(100vh - var(--header-height) - var(--toolbar-height));
    --toolbar-height: 50px;
    --background-color: rgb(34, 34, 34);
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    background-color: var(--background-color);
    color: white;
    display: flex;
    flex-direction: column;
`

const HeaderContainer = styled.div`
    height: var(--header-height);
    -webkit-app-region: drag;
`

function Main() {
    return (
        <Container>
            <HeaderContainer />
            <Thumbnails />
            <Toolbar />
        </Container>
    );
}

export default Main;
