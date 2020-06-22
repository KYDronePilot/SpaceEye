import * as moment from 'moment'
import { Moment } from 'moment'
import * as Url from 'url'
import * as Path from 'path'
import * as fs from 'fs'
import * as AsyncLock from 'async-lock'
// import axios from 'axios';
import axios, { CancelTokenSource } from 'axios'
import { Readable } from 'stream'

const IMAGE_DIR = '/tmp/efsl_test_images'
const imageDownloadResourceKey = 'imageDownload'
let downloaderLock = new AsyncLock()
let cancelDownloadSourse: CancelTokenSource | undefined
axios.defaults.adapter = require('axios/lib/adapters/http')

interface URLImageTypes {
    tiny: string
    small: string
    large: string
    full: string
}

interface ImageData {
    /**
     * Unique ID of the satellite view.
     */
    id: number

    /**
     * Name of the image.
     */
    name: string

    /**
     * Name of the spacecraft images are taken from.
     */
    spacecraft: string
    interval: number
    aspect: number
    url: URLImageTypes
}

/**
 * A view from a particular satellite.
 */
interface SatelliteView {
    /**
     * Unique ID of the view.
     */
    id: number

    /**
     * Name of the satellite (e.g. GOES-West).
     */
    satelliteName: string

    /**
     * Name of the view (e.g. Continental US).
     */
    viewName: string

    /**
     * Images which can be downloaded for this view.
     */
    images: SourceImage[]
}

/**
 * Information about a particular image from a satellite view which can be downloaded.
 */
export interface SourceImage {
    /**
     * Unique identifier for the image.
     */
    id: number

    /**
     * URL to download the image.
     */
    url: string

    /**
     * How often the image should be updated in seconds.
     */
    updateInterval: number

    /**
     * Dimensions of the image (width, height).
     */
    dimensions: [number, number]
}

/**
 * A source image which has been downloaded.
 */
export interface DownloadedImage extends SourceImage {
    /**
     * UTC timestamp of when the image was downloaded.
     */
    timestamp: Moment
}

/**
 * Get extension from a URL.
 * @param url - The URL
 * @return URL file extension if exists
 */
function getUrlExtension(url: string): string {
    return Path.extname(Url.parse(url).pathname!)
}

/**
 * Format timestamp used in image file names.
 * @param timestamp - Timestamp to format
 * @return Formatted timestamp
 */
function formatTimestamp(timestamp: Moment): string {
    return timestamp.unix().toString()
}

/**
 * Format a file path for a downloaded image.
 * @param image - Information about downloaded image
 * @return Path to image
 */
function formatImagePath(image: DownloadedImage): string {
    const ext = getUrlExtension(image.url)
    return Path.join(IMAGE_DIR, `${image.id}-${formatTimestamp(image.timestamp)}${ext}`)
}

/**
 * Get the downloaded images' filenames for a particular ID.
 * @param imageId - Image ID to look for
 * @return Filenames of downloaded images
 */
function getDownloadedImages(imageId: number): string[] {
    const regex = new RegExp(`${imageId}-\\d+\\.\\w+`)
    return fs.readdirSync(IMAGE_DIR).filter(filename => filename.match(regex))
}

/**
 * Get the timestamps of downloaded images for an image ID.
 */
function getImageTimestamps(imageId: number): Moment[] {
    return getDownloadedImages(imageId).map(filename => {
        const unixTimestamp = filename.match(/\d+-(\d+)\.\w+/)![1]
        return moment.unix(parseInt(unixTimestamp, 10))
    })
}

interface ImageDownloadResponse {}

/**
 * Download and save an image.
 * @param image - Details about image to download
 * @return Details about downloaded image
 */
export async function downloadImage(image: SourceImage, timeout: number): Promise<DownloadedImage> {
    return downloaderLock.acquire(imageDownloadResourceKey, async () => {
        const downloadedImage: DownloadedImage = {
            ...image,
            timestamp: moment.utc()
        }
        const path = formatImagePath(downloadedImage)
        const source = axios.CancelToken.source()
        cancelDownloadSourse = source

        setTimeout(() => {
            source.cancel('Download cancelled due to timeout')
        }, timeout)

        return new Promise<DownloadedImage>((resolve, reject) => {
            axios({
                url: image.url,
                method: 'GET',
                responseType: 'stream',
                cancelToken: source.token
            }).then(({ data, headers }) => {
                const writer = fs.createWriteStream(path)
                const dataStream = data as Readable
                dataStream.pipe(writer)

                source.token.promise.then(cancellation => {
                    writer.destroy()
                    // Delete partially downloaded file if there was an error
                    if (fs.existsSync(path)) {
                        fs.unlinkSync(path)
                    }
                    reject(cancellation)
                })
                writer.on('finish', () => {
                    resolve(downloadedImage)
                })
            }).catch(error => reject(error))
        })
    })
}
