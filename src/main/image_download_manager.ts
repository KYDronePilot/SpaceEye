// eslint-disable-next-line max-classes-per-file
import Axios, { CancelTokenSource } from 'axios'
import Fs from 'fs'
import moment from 'moment'
import { Readable } from 'stream'
import { clearTimeout, setTimeout } from 'timers'

import { UpdateLock } from './update_lock'
import { DownloadedImage } from './wallpaper_requester'

/**
 * Download a file as a cancellable stream.
 *
 * @param url - URL to download
 * @param destPath - Destination file path to save to
 * @param cancelToken - Cancel token
 */
async function downloadStream(
    url: string,
    destPath: string,
    cancelToken: CancelTokenSource
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        Axios.get(url, {
            responseType: 'stream',
            cancelToken: cancelToken.token
        })
            .then(({ data, headers }) => {
                const writer = Fs.createWriteStream(destPath)
                const dataStream = data as Readable
                dataStream.pipe(writer)
                cancelToken.token.promise.then(cancellation => {
                    writer.destroy()
                    // Delete partially downloaded file
                    Fs.exists(destPath, exists => {
                        if (exists) {
                            Fs.unlink(destPath, () => {
                                reject(cancellation)
                            })
                        } else {
                            reject(cancellation)
                        }
                    })
                })
                writer.on('close', () => {
                    resolve()
                })
            })
            .catch(error => {
                reject(error)
            })
    })
}

export class RequestCancelledError extends Error {}

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
 * @param lock - Active lock on the download pipeline
 * @throws {RequestCancelledError} If request is cancelled
 * @returns Downloaded image information
 */
export async function downloadImage(
    image: ImageSource,
    lock: UpdateLock
): Promise<DownloadedImage> {
    // TODO: This first part may be unnecessary...
    // TODO: If it is necessary, change to use functions rather than accessing
    //  `downloadCancelTokens` directly
    // Check if there is already a download in progress for the image
    if (image.id in lock.downloadCancelTokens) {
        // If so, cancel it
        lock.downloadCancelTokens[image.id].cancel()
    }
    // Replace with our token
    // eslint-disable-next-line no-param-reassign
    lock.downloadCancelTokens[image.id] = Axios.CancelToken.source()
    // FIXME: Don't leave as hardcoded jpg
    const downloadedImage = new DownloadedImage(image.id, moment.utc(), 'jpg')

    try {
        await downloadStream(
            image.url,
            downloadedImage.getPath(),
            lock.downloadCancelTokens[image.id]
        )
        // eslint-disable-next-line no-param-reassign
        delete lock.downloadCancelTokens[image.id]
    } catch (error) {
        // eslint-disable-next-line no-param-reassign
        delete lock.downloadCancelTokens[image.id]
        // Throw special error if request is cancelled
        if (Axios.isCancel(error)) {
            throw new RequestCancelledError()
        }
        // Rethrow if not
        throw error
    }
    return downloadedImage
}
