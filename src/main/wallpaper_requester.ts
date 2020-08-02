import AsyncLock from 'async-lock'
// import axios from 'axios';
import axios, { CancelTokenSource } from 'axios'
import * as fs from 'fs'
import { maxBy } from 'lodash'
import moment, { Moment } from 'moment'
import * as Path from 'path'
import { Readable } from 'stream'
import * as Url from 'url'

import { UPDATE_INTERVAL_MIN } from './wallpaper_manager'

export const IMAGE_DIR = '/tmp/efsl_test_images'
const imageDownloadResourceKey = 'imageDownload'
const downloaderLock = new AsyncLock()
let cancelDownloadSource: CancelTokenSource | undefined
axios.defaults.adapter = require('axios/lib/adapters/http')

/**
 * Format timestamp used in image file names.
 * @param timestamp - Timestamp to format
 * @return Formatted timestamp
 */
function formatTimestamp(timestamp: Moment): string {
    return timestamp.valueOf().toString()
}

export class DownloadedImage {
    imageId: number

    timestamp: Moment

    extension: string

    constructor(imageId: number, timestamp: Moment, extension: string) {
        this.imageId = imageId
        this.timestamp = timestamp
        this.extension = extension
    }

    /**
     * Construct a DownloadedImage instance from the path to a downloaded image.
     * @param path - Path to the image
     */
    static constructFromPath(path: string): DownloadedImage {
        const fileName = Path.basename(path)
        const matchGroup = fileName.match(/(\d+)-(\d+)\.(\w+)/)! // TODO: What if there is an error?
        return new DownloadedImage(
            parseInt(matchGroup[1], 10),
            moment(parseInt(matchGroup[2], 10)),
            matchGroup[3]
        )
    }

    static async constructNewestExistingImage(id: number): Promise<DownloadedImage | undefined> {
        const regex = new RegExp(`^${id}-\\d+\\.\\w+$`)

        return new Promise<DownloadedImage | undefined>((resolve, reject) => {
            fs.readdir(IMAGE_DIR, (err, files) => {
                if (err) {
                    reject(err)
                }
                const matchingFiles = files.filter(file => Path.basename(file).match(regex))
                const downloadedImages = matchingFiles.map(file =>
                    DownloadedImage.constructFromPath(file)
                )
                const newestImage = maxBy(downloadedImages, image => image.timestamp.valueOf())
                if (
                    newestImage !== undefined &&
                    moment.utc().diff(newestImage.timestamp, 'minutes') <= UPDATE_INTERVAL_MIN
                ) {
                    return resolve(newestImage)
                }
                return resolve()
            })
        })
    }

    /**
     * Get the path to the file.
     * @returns Path to the downloaded file
     */
    public getPath(): string {
        return Path.join(
            IMAGE_DIR,
            `${this.imageId}-${formatTimestamp(this.timestamp)}.${this.extension}`
        )
    }
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

/**
 * Download and save an image.
 * @param image - Image source details
 * @return Details about downloaded image
 */
export async function downloadImage(
    image: ImageSource,
    timeout: number,
    cancelTokenSource: CancelTokenSource
): Promise<DownloadedImage> {
    return downloaderLock.acquire(imageDownloadResourceKey, async () => {
        // If timeout is exceeded, cancel the download
        setTimeout(() => {
            cancelTokenSource.cancel('Download cancelled due to timeout')
        }, timeout)

        // FIXME: Don't leave as hardcoded jpg
        const downloadedImage = new DownloadedImage(image.id, moment.utc(), 'jpg')
        const path = downloadedImage.getPath()

        return new Promise<DownloadedImage>((resolve, reject) => {
            axios({
                url: image.url,
                method: 'GET',
                responseType: 'stream',
                cancelToken: cancelTokenSource.token
            })
                .then(({ data, headers }) => {
                    const writer = fs.createWriteStream(path)
                    const dataStream = data as Readable
                    dataStream.pipe(writer)

                    cancelTokenSource.token.promise.then(cancellation => {
                        writer.destroy()
                        // Delete partially downloaded file if there was an error
                        if (fs.existsSync(path)) {
                            fs.unlink(path, () => {
                                reject(cancellation)
                            })
                        }
                    })
                    writer.once('finish', () => {
                        resolve(downloadedImage)
                    })
                })
                .catch(error => reject(error))
        })
    })
}
