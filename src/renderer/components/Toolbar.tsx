import * as React from 'react';
import styled from 'styled-components';
import Button from './Button';

const ToolbarContainer = styled.div`
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100%;
    height: var(--toolbar-height);
    background-color: rgb(65, 65, 65);
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
    
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
`

const Toolbar = () => (
    <ToolbarContainer>
        <Button />
    </ToolbarContainer>
);

export default Toolbar;
