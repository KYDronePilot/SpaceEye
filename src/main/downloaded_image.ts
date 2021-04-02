import electronLog from 'electron-log'
import * as fs from 'fs'
import { maxBy } from 'lodash'
import moment, { Moment } from 'moment'
import * as Path from 'path'
import { promisify } from 'util'

import { IMAGE_RETENTION_TIME } from './consts'
import { IMAGES_DIR } from './paths'

const log = electronLog.scope('downloaded-image')

const asyncReadDir = promisify(fs.readdir)
const asyncUnlink = promisify(fs.unlink)

/**
 * Format timestamp used in image file names.
 *
 * @param timestamp - Timestamp to format
 * @returns Formatted timestamp
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
     *
     * @param path - Path to the image
     * @returns New DownloadedImage instance
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

    static async getNewestDownloadedImage(id: number): Promise<DownloadedImage | undefined> {
        const allImages = await DownloadedImage.getDownloadedImages()
        const matchingImages = allImages.filter(image => image.imageId === id)
        return maxBy(matchingImages, image => image.timestamp.valueOf())
    }

    /**
     * Get all downloaded images.
     *
     * @returns All downloaded images
     */
    static async getDownloadedImages(): Promise<DownloadedImage[]> {
        const files = await asyncReadDir(IMAGES_DIR)
        log.debug('All files in images dir:', files)
        // Filter so we only have the files of images we want
        // TODO: Handle other extensions
        const imageRegex = new RegExp(`^\\d+-\\d+\\.(jpg)$`)
        const imageFiles = files.filter(file => Path.basename(file).match(imageRegex))
        log.debug('All image files:', imageFiles)
        return imageFiles.map(file => DownloadedImage.constructFromPath(file))
    }

    /**
     * Clean up partially downloaded images.
     */
    static async cleanUpPartiallyDownloadedImages(): Promise<void> {
        const files = await asyncReadDir(IMAGES_DIR)
        log.debug('All files in images dir:', files)
        // Filter so we only have the partially downloaded image files
        // TODO: Handle other extensions
        const imageRegex = new RegExp(`^\\d+-\\d+\\.(jpg)\\.download$`)
        const imageFiles = files.filter(file => Path.basename(file).match(imageRegex))
        log.debug('All partially downloaded image files to delete:', imageFiles)
        await Promise.all(imageFiles.map(file => asyncUnlink(Path.join(IMAGES_DIR, file))))
    }

    /**
     * Delete old images.
     */
    public static async cleanupOldImages(): Promise<void> {
        const downloadedImages = await DownloadedImage.getDownloadedImages()
        const now = moment.utc()
        const oldImages = downloadedImages.filter(
            image => now.diff(image.timestamp, 'minutes') > IMAGE_RETENTION_TIME
        )
        log.debug(
            'Deleting old images:',
            oldImages.map(image => image.getPath())
        )
        await Promise.all(oldImages.map(image => asyncUnlink(image.getPath())))
        await DownloadedImage.cleanUpPartiallyDownloadedImages()
    }

    /**
     * Delete the downloaded image.
     */
    public async delete(): Promise<void> {
        await asyncUnlink(this.getPath())
    }

    /**
     * Get the path to the file.
     *
     * @returns Path to the downloaded file
     */
    public getPath(): string {
        return Path.join(
            IMAGES_DIR,
            `${this.imageId}-${formatTimestamp(this.timestamp)}.${this.extension}`
        )
    }

    /**
     * Get the path to download the file to.
     *
     * Has the extension `.download` so the system won't use the file till it's fully downloaded.
     *
     * @returns Path to download file to
     */
    public getDownloadPath(): string {
        return `${this.getPath()}.download`
    }
}
