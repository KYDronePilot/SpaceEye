// eslint-disable-next-line max-classes-per-file
import Axios, { CancelTokenSource } from 'axios'
import Fs from 'fs'
import moment from 'moment'
import { Readable } from 'stream'
import { clearTimeout, setTimeout } from 'timers'

import { DownloadedImage } from './wallpaper_requester'

/**
 * Download a file as a cancellable stream.
 * @param url - URL to download
 * @param destPath - Destination file path to save to
 * @param timeout - Timeout before cancelling download
 * @param cancelToken - Cancel token
 */
async function downloadStream(
    url: string,
    destPath: string,
    timeout: number,
    cancelToken: CancelTokenSource
): Promise<void> {
    // Cancel download if timeout exceeded
    const timeoutHandle = setTimeout(() => {
        cancelToken.cancel('Timeout')
    }, timeout)

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
                                clearTimeout(timeoutHandle)
                                reject(cancellation)
                            })
                        } else {
                            clearTimeout(timeoutHandle)
                            reject(cancellation)
                        }
                    })
                })
                writer.on('close', () => {
                    clearTimeout(timeoutHandle)
                    resolve()
                })
            })
            .catch(error => {
                reject(error)
                clearTimeout(timeoutHandle)
            })
    })
}

export class RequestCancelledError extends Error {}

/**
 * For managing image downloads.
 */
export class ImageDownloadManager {
    private static instance?: ImageDownloadManager

    private cancelTokens: { [key: number]: CancelTokenSource }

    private constructor() {
        this.cancelTokens = {}
    }

    public static get Instance(): ImageDownloadManager {
        if (this.instance === undefined) {
            this.instance = new this()
        }
        return this.instance
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
     * @param image - Image to download
     * @param downloadLockKey - Key to prevent concurrent downloads
     * @param timeout - Timeout before cancelling the request
     * @throws {RequestCancelledError} If request is cancelled
     * @returns Downloaded image information
     */
    public async downloadImage(
        image: ImageSource,
        downloadLockKey: number,
        timeout: number
    ): Promise<DownloadedImage> {
        // Check if there is already a lock on the token
        if (downloadLockKey in this.cancelTokens) {
            // If so, cancel it
            this.cancelTokens[downloadLockKey].cancel()
        }
        // Replace with our token
        this.cancelTokens[downloadLockKey] = Axios.CancelToken.source()
        // FIXME: Don't leave as hardcoded jpg
        const downloadedImage = new DownloadedImage(image.id, moment.utc(), 'jpg')

        try {
            await downloadStream(
                image.url,
                downloadedImage.getPath(),
                timeout,
                this.cancelTokens[downloadLockKey]
            )
            delete this.cancelTokens[downloadLockKey]
        } catch (error) {
            delete this.cancelTokens[downloadLockKey]
            // Throw special error if request is cancelled
            if (Axios.isCancel(error)) {
                throw new RequestCancelledError()
            }
            // Rethrow if not
            throw error
        }
        return downloadedImage
    }
}
