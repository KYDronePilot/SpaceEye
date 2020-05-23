import * as React from 'react';
import styled from 'styled-components';
import { FC } from 'react';

enum ButtonType {
    Primary,
    Secondary,
    Destructive,
}

interface ButtonContainerProps {
    readonly type: ButtonType
}

const ButtonContainer = styled.button`
    margin: 5px;
    background-color: blue;
    border-style: none;
    border-radius: 10px;
    color: antiquewhite;
    padding: 10px;
    box-shadow: 0 0 20px black;
`

interface ButtonProps {
    type: ButtonType
    onClick: () => void
}

const Button = () => (
    <ButtonContainer>
        Set Background
    </ButtonContainer>
);

export default Button;
