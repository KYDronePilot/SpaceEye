import * as React from 'react';
import { Component } from 'react';
import styled from 'styled-components';
import Thumbnail from './Thumbnail';

const Container = styled.div`
    background-color: #121212;
    margin: 20px;
    flex-grow: 1;
    border-radius: 10px;
    box-shadow: 0 0 15px black inset;
    display: flex;
    flex-wrap: wrap;
`

class Thumbnails extends Component {
    render() {
        return (
            <Container>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/FD/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'http://rammb.cira.colostate.edu/ramsdis/online/images/thumb/himawari-8/full_disk_ahi_true_color.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/tpw/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/CONUS/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/np/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/nsa/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ssa/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'http://rammb.cira.colostate.edu/ramsdis/online/images/thumb/himawari-8/full_disk_ahi_true_color.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/CONUS/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/taw/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/tpw/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/CONUS/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES17/ABI/SECTOR/np/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/nsa/GEOCOLOR/thumbnail.jpg'}/>
                <Thumbnail src={'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ssa/GEOCOLOR/thumbnail.jpg'}/>
            </Container>
        );
    }
}

export default Thumbnails;
