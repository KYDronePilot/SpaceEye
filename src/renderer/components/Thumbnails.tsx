import * as React from 'react';
import styled from 'styled-components';
import SimpleBar from 'simplebar-react';
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

const Thumbnails = () => (
    <Container>
        <ThumbnailSimpleBar>
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
        </ThumbnailSimpleBar>
    </Container>
);

export default Thumbnails;
