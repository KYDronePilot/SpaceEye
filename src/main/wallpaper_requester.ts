import * as moment from 'moment';
import axios from 'axios';
import { Moment } from 'moment';
import * as Url from 'url';
import * as Path from 'path';


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
interface SourceImage {
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
interface DownloadedImage extends SourceImage {
    /**
     * UTC timestamp of when the image was downloaded.
     */
    timestamp: Moment
}

moment.utc()

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
 * Format a name for a downloaded image.
 * @param image - Information about downloaded image
 * @return File name for image
 */
function formatImageName(image: DownloadedImage): string {
    const ext = getUrlExtension(image.url)
    return `${image.id}-${formatTimestamp(image.timestamp)}.${ext}`
}

export async function downloadImage(image: SourceImage) {
}
