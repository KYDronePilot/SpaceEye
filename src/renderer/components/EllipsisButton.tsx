import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const EllipsisIconBlock = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 30px;
`

const EllipsisIconClickableContainer = styled(Link)`
    width: 13px;
    height: 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 5px 5px;
    cursor: pointer;
    --ellipsis-icon-color: #c7c7c7;
    &:hover {
        --ellipsis-icon-color: white;
    }
    -webkit-app-region: no-drag;
`

const EllipsisIconSvg = styled.svg`
    width: auto;
    height: auto;
    fill: var(--ellipsis-icon-color);
`

const EllipsisButton: React.FunctionComponent = props => {
    return (
        <EllipsisIconBlock>
            <EllipsisIconClickableContainer to="/settings">
                <EllipsisIconSvg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    viewBox="0 0 377.3793 94.344836"
                    enable-background="new 0 0 96 96"
                >
                    <path
                        d={`m 94.344824,47.172415 c 0,14.151724 \
                        -4.717246,23.586209 -14.151724,33.020697 \
                        -9.434485,9.434478 -21.227591,14.151724 \
                        -33.020691,14.151724 -14.15173,0 -23.58621,\
                        -4.717246 -33.02069,-14.151724 C 4.7172294,\
                        70.758624 -5.9265128e-7,58.965516 -5.9265128e-7,\
                        47.172415 -5.9265128e-7,35.379314 4.7172294,\
                        23.586207 14.151719,14.151724 23.586199,\
                        4.717242 35.379299,0 47.172409,0 c 11.7931,\
                        0 23.586206,4.717242 33.020691,14.151724 9.434478,\
                        9.434483 14.151724,21.22759 14.151724,33.020691 z m \
                        141.517246,0 c 0,14.151724 -4.71724,23.586209 -14.15172,\
                        33.020697 -9.43449,9.434478 -21.2276,14.151724 -33.0207,\
                        14.151724 -14.15172,0 -23.58621,-4.717246 -33.02069,\
                        -14.151724 -9.43448,-9.434488 -14.15172,-21.227596 -14.15172,\
                        -33.020697 0,-11.793101 4.71724,-23.586208 14.15172,\
                        -33.020691 C 165.10344,4.717242 176.89655,0 188.68965,\
                        0 c 11.7931,0 23.58621,4.717242 33.0207,14.151724 9.43448,\
                        9.434483 14.15172,21.22759 14.15172,33.020691 z m 141.51724,\
                        0 c 0,14.151724 -4.71724,23.586209 -14.15172,33.020697 C 353.79311,\
                        89.62759 342,94.344836 330.2069,94.344836 c -14.15172,\
                        0 -23.58621,-4.717246 -33.02069,-14.151724 -9.43448,\
                        -9.434488 -14.15173,-21.227596 -14.15173,-33.020697 0\
                        ,-11.793101 4.71725,-23.586208 14.15173,-33.020691 C 306.62069\
                        ,4.717242 318.41379,0 330.2069,0 342,0 353.79311,4.717242 363.22759,\
                        14.151724 c 9.43448,9.434483 14.15172,21.22759 14.15172,33.020691 z`}
                        id="path4"
                    />
                </EllipsisIconSvg>
            </EllipsisIconClickableContainer>
        </EllipsisIconBlock>
    )
}

export default EllipsisButton
