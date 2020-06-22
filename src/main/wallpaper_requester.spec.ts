import * as AsyncLock from 'async-lock';
import axios from 'axios'
import {downloadImage, SourceImage, DownloadedImage} from './wallpaper_requester'
import { netLog } from 'electron'

let downloaderLock = new AsyncLock()

function operation2() {
    console.log("Execute operation2");
    downloaderLock.acquire("key1", function(done) {
        console.log("lock2 enter")
        setTimeout(function() {
            console.log("lock2 Done")
            done();
        }, 1000)
    }, function(err, ret) {
        console.log("lock2 release")
    }, {});
}


describe('Wallpaper Requester', () => {
    // it('can list files', async (done) => {
    //     const url = 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/thumbnail.jpg'
    //     const {data, headers} = await axios.get(url, {responseType: 'stream'})
    //     done()
    // })

    it('runs a generic test', (done) => {
        jest.setTimeout(20000)
        const source: SourceImage = {
            id: 2,
            url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/latest.jpg',
            dimensions: [1920, 1080],
            updateInterval: 100
        }
        downloadImage(source, 4000)
            .then(res => {
                console.log(res)
                done()
            })
            .catch(err => {
                console.log(`Error: ${err}`)
                done()
            })
    })
})
