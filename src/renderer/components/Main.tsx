import * as React from 'react';
import styled from 'styled-components';
import Thumbnails from './Thumbnails';

const Container = styled.div`
    --header-height: 70px;
    --thumbnails-height: calc(100vh - var(--header-height) - var(--toolbar-height));
    --toolbar-height: 50px;
    position: absolute;
    //height: 100vh;
    width: 100%;
    top: 0;
    left: 0;
    background-color: rgb(34, 34, 34);
    color: white;
    display: flex;
    flex-direction: column;
`

const ThumbnailContainer = styled.div`
    
`

const HeaderContainer = styled.div`
    height: var(--header-height);
    //position: absolute;
    //top: -20px;
    -webkit-app-region: drag;
`

const Toolbar = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    height: var(--toolbar-height);
    background-color: rgb(65, 65, 65);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
`

function Main() {
    return (
        <Container>
            <HeaderContainer>
                {/* <h2>This is another test</h2> */}
            </HeaderContainer>
            <Thumbnails />
            <Toolbar />
        </Container>
    );
}

export default Main;
