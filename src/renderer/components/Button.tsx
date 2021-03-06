import * as React from 'react'
import styled from 'styled-components'

// enum ButtonType {
//     Primary,
//     Secondary,
//     Destructive
// }

// interface ButtonContainerProps {
//     children: React.ReactNode
// }

const ButtonContainer = styled.button`
    border: none;
    text-decoration: none;
    appearance: none;
    outline: none;
    cursor: pointer;
    margin: 5px;
    background-color: rgb(33, 75, 243);
    border-radius: 10px;
    color: white;
    padding: 10px;
    box-shadow: 0 0 20px black;
`

interface ButtonProps {
    onClick: () => void
    children: React.ReactNode
}

const Button: React.FC<ButtonProps> = props => {
    const { children, onClick } = props
    return <ButtonContainer onClick={onClick}>{children}</ButtonContainer>
}

export default Button
