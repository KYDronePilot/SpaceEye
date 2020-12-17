// eslint-disable-next-line max-classes-per-file
import Axios, { CancelTokenSource } from 'axios'
import electronLog from 'electron-log'
import Fs from 'fs'
import moment from 'moment'
import { Readable } from 'stream'
import { promisify } from 'util'

import { ImageSource } from '../shared/config_types'
import { DownloadedImage } from './downloaded_image'
import { FileDoesNotExistError, RequestCancelledError } from './errors'
import { UpdateLock } from './update_lock'

const log = electronLog.scope('image-downloader')

const existsAsync = promisify(Fs.exists)
const unlinkAsync = promisify(Fs.unlink)

// eslint-disable-next-line jsdoc/require-returns
/**
 * Download a file as a cancellable stream.
 *
 * @param url - URL to download
 * @param destPath - Destination file path to save to
 * @param cancelToken - Cancel token
 * @param onProgress - Called whenever the percentage downloaded value is updated
 */
async function downloadStream(
    url: string,
    destPath: string,
    cancelToken: CancelTokenSource,
    onProgress: (percentage?: number) => void
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        Axios.get(url, {
            responseType: 'stream',
            cancelToken: cancelToken.token
        })
            .then(({ data, headers }) => {
                const writer = Fs.createWriteStream(destPath)
                const dataStream = data as Readable
                // Get the content size (if available)
                const contentLength = parseInt((headers ?? {})['content-length'] ?? '-1', 10)
                // If none found, signal that the download has begun indeterminately
                if (contentLength === -1) {
                    onProgress(-1)
                } else {
                    // If length found, set up to send percentage updates
                    let lengthDownloaded = 0
                    let previousPercentage = -1
                    // TODO: NOT TYPESAFE!!!!!!!!!
                    dataStream.on('data', chunk => {
                        lengthDownloaded += chunk.length
                        const percentage = Math.round((lengthDownloaded / contentLength) * 100)
                        // Only send an update if a percentage point changed
                        if (percentage !== previousPercentage) {
                            previousPercentage = percentage
                            onProgress(percentage)
                        }
                    })
                }
                dataStream.pipe(writer)
                let isCancelled = false
                cancelToken.token.promise.then(async cancellation => {
                    log.debug('Download canceled for:', url)
                    isCancelled = true
                    writer.destroy()
                    // Delete partially downloaded file
                    if (await existsAsync(destPath)) {
                        log.debug('Deleting partially downloaded file:', destPath)
                        await unlinkAsync(destPath)
                        reject(cancellation)
                    }
                })
                writer.on('close', () => {
                    // Signal that we are done downloading
                    onProgress(undefined)
                    if (!isCancelled) {
                        resolve()
                    }
                })
            })
            .catch(error => {
                reject(error)
            })
    })
}

/**
 * Download an image, canceling any other downloads with the same lock key
 * already in progress.
 *
 * If 2 downloads have the same key and one is already in progress when the
 * other is called, the first will be canceled so the second can begin.
 *
 * If 2+ downloads all have different keys, they will be allowed to download
 * in parallel.
 *
 * @param image - Image to download
 * @param cancelToken - Cancel token for this download
 * @param lock - Active lock on the download pipeline
 * @param onProgress - Called whenever the percentage downloaded value is updated
 * @throws {RequestCancelledError} If request is cancelled
 * @returns Downloaded image information
 */
export async function downloadImage(
    image: ImageSource,
    cancelToken: CancelTokenSource,
    lock: UpdateLock,
    onProgress: (percentage?: number) => void
): Promise<DownloadedImage> {
    // FIXME: Don't leave as hardcoded jpg
    const downloadedImage = new DownloadedImage(image.id, moment.utc(), 'jpg')
    log.debug('Downloading image to:', downloadedImage.getPath())

    try {
        await downloadStream(image.url, downloadedImage.getPath(), cancelToken, onProgress)
        lock.destroyCancelToken(cancelToken)
    } catch (error) {
        lock.destroyCancelToken(cancelToken)
        // Throw special error if request is cancelled
        if (Axios.isCancel(error)) {
            log.debug('Download cancelled for image:', image.id)
            throw new RequestCancelledError()
        }
        log.debug('Unknown error while downloading image:', image.id)
        // Rethrow if not
        throw error
    }
    // Sanity check to make sure the image actually exists
    if (await existsAsync(downloadedImage.getPath())) {
        log.debug('Successfully downloaded image:', image.id)
        return downloadedImage
    }
    // Else, throw an error
    log.debug("Image file doesn't exist at:", downloadedImage.getPath())
    throw new FileDoesNotExistError(
        `Downloaded image "${downloadedImage.getPath()}" does not exist`
    )
}
