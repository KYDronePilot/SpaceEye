import * as React from 'react';
import styled from 'styled-components';
import Thumbnail from './Thumbnail';

const Container = styled.div`
    //margin: 40px;
    flex-grow: 1;
    height: var(--thumbnails-height);
`;

const ThumbnailGrid = styled.div`
    //padding: 40px;
    margin: 0 50px;
    //position: absolute;
    //background-color: #121212;
    height: 100%;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 20px;
    }
    &::-webkit-scrollbar-thumb {
      color: red;
    }
    //&::-webkit-scrollbar-track {
    //  color: red;
    //}
    //border-radius: 10px;
    //box-shadow: 0 0 15px black inset;
    display: grid;
    max-width: 100%;
    //grid-auto-rows: auto;
    //grid-auto-columns: auto;
    //flex-wrap: wrap;
    //justify-content: flex-start;
    grid-auto-flow: row;
    //justify-items: stretch;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 20px;
    justify-items: center;
    text-align: center;
`;

const Thumbnails = () => (
    <Container>
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
    </Container>
);

export default Thumbnails;
