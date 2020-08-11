// import * as AsyncLock from 'async-lock'
// import axios from 'axios'
// import { classToPlain, deserialize, plainToClass, serialize } from 'class-transformer'
// import { netLog } from 'electron'
// import moment from 'moment'

// import { DownloadedImage } from './wallpaper_requester'

// // import { DownloadedImage, downloadImage, SourceImage } from './wallpaper_requester'

// // const downloaderLock = new AsyncLock()

// // function operation2() {
// //     console.log('Execute operation2')
// //     downloaderLock.acquire(
// //         'key1',
// //         function(done) {
// //             console.log('lock2 enter')
// //             setTimeout(function() {
// //                 console.log('lock2 Done')
// //                 done()
// //             }, 1000)
// //         },
// //         function(err, ret) {
// //             console.log('lock2 release')
// //         },
// //         {}
// //     )
// // }

// // describe('Wallpaper Requester', () => {
// //     // it('can list files', async (done) => {
// //     //     const url = 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/thumbnail.jpg'
// //     //     const {data, headers} = await axios.get(url, {responseType: 'stream'})
// //     //     done()
// //     // })

// //     it('runs a generic test', done => {
// //         jest.setTimeout(20000)
// //         const source: SourceImage = {
// //             id: 2,
// //             url: 'https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/latest.jpg',
// //             dimensions: [1920, 1080],
// //             updateInterval: 100
// //         }
// //         downloadImage(source, 4000)
// //             .then(res => {
// //                 console.log(res)
// //                 done()
// //             })
// //             .catch(err => {
// //                 console.log(`Error: ${err}`)
// //                 done()
// //             })
// //     })
// // })

// describe('DownloadedImage class', () => {
//     it('Serializes properly', () => {
//         const time = moment('2020-07-28T02:49:42.565Z')
//         const downloadedImage = new DownloadedImage(1, time, 'jpg')
//         const res = JSON.stringify(downloadedImage)
//         expect(res).toEqual(
//             '{"imageId":1,"timestamp":"2020-07-28T02:49:42.565Z","extension":"jpg"}'
//         )
//     })

//     it('Deserializes properly', () => {
//         const time = moment('2020-07-28T02:49:42.565Z')
//         const downloadedImageObject = new DownloadedImage(1, time, 'jpg')
//         const downloadedImage =
//             '{"imageId":1,"timestamp":"2020-07-28T02:49:42.565Z","extension":"jpg"}'
//         const res = deserialize(DownloadedImage, downloadedImage)
//         expect(res).toEqual(downloadedImageObject)
//     })
// })
