import * as React from 'react';
import styled from 'styled-components';
import Thumbnail from './Thumbnail';

const Container = styled.div`
    flex-grow: 1;
    height: var(--thumbnails-height);
`;

const ScrollbarColorInnerContainer = styled.div`
    --scrollbar-color: rgb(60, 60, 60);
    --scrollbar-hover-color: rgb(65, 65, 65);
    max-height: 100%;
    background-color: transparent;
    transition: background-color 500ms;
    overflow-y: scroll;
    margin-right: 10px;
    
    &:hover {
        background-color: var(--scrollbar-color);
        transition: background-color 200ms;
    }
    
    &::-webkit-scrollbar {
        width: 12px;
    }
    
    &::-webkit-scrollbar-track {
        background-color: var(--background-color);
    }
    
    &::-webkit-scrollbar-thumb {
        border-radius: 10px;
        background-color: inherit;
    }
    
    &::-webkit-scrollbar-thumb:hover {
        background-color: var(--scrollbar-hover-color);
    }
`

const ThumbnailGrid = styled.div`
    padding: 20px 50px;
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

const Thumbnails = () => (
    <Container>
        <ScrollbarColorInnerContainer>
            <ThumbnailGrid>
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/FD/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail
                    src="http://rammb.cira.colostate.edu/ramsdis/online/images/thumb/himawari-8/full_disk_ahi_true_color.jpg"
                    />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/tpw/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/CONUS/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/np/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/nsa/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ssa/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail
                    src="http://rammb.cira.colostate.edu/ramsdis/online/images/thumb/himawari-8/full_disk_ahi_true_color.jpg"
                    />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/tpw/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/CONUS/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/np/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/nsa/GEOCOLOR/thumbnail.jpg" />
                <Thumbnail src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ssa/GEOCOLOR/thumbnail.jpg" />
            </ThumbnailGrid>
        </ScrollbarColorInnerContainer>
    </Container>
);

export default Thumbnails;
