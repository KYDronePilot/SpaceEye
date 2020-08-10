// eslint-disable-next-line max-classes-per-file
import Axios, { CancelTokenSource } from 'axios'
import Fs from 'fs'
import moment from 'moment'
import { Readable } from 'stream'
import { promisify } from 'util'

import { DownloadedImage } from './downloaded_image'
import { FileDoesNotExistError, RequestCancelledError } from './errors'
import { UpdateLock } from './update_lock'

const existsAsync = promisify(Fs.exists)
const unlinkAsync = promisify(Fs.unlink)

// eslint-disable-next-line jsdoc/require-returns
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
            .then(({ data }) => {
                const writer = Fs.createWriteStream(destPath)
                const dataStream = data as Readable
                dataStream.pipe(writer)
                cancelToken.token.promise.then(async cancellation => {
                    writer.destroy()
                    // Delete partially downloaded file
                    if (await existsAsync(destPath)) {
                        await unlinkAsync(destPath)
                        reject(cancellation)
                    }
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
 * @throws {RequestCancelledError} If request is cancelled
 * @returns Downloaded image information
 */
export async function downloadImage(
    image: ImageSource,
    cancelToken: CancelTokenSource,
    lock: UpdateLock
): Promise<DownloadedImage> {
    // FIXME: Don't leave as hardcoded jpg
    const downloadedImage = new DownloadedImage(image.id, moment.utc(), 'jpg')

    try {
        await downloadStream(image.url, downloadedImage.getPath(), cancelToken)
        lock.destroyCancelToken(cancelToken)
    } catch (error) {
        lock.destroyCancelToken(cancelToken)
        // Throw special error if request is cancelled
        if (Axios.isCancel(error)) {
            throw new RequestCancelledError()
        }
        // Rethrow if not
        throw error
    }
    // Sanity check to make sure the image actually exists
    if (await existsAsync(downloadedImage.getPath())) {
        return downloadedImage
    }
    // Else, throw an error
    throw new FileDoesNotExistError(
        `Downloaded image "${downloadedImage.getPath()}" does not exist`
    )
}
