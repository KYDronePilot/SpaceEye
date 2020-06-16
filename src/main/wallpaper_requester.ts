

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

interface DownlinkSourcesResponse {
    sources: ImageData[]
}
