/**
 * Information about a particular image source.
 */
interface ImageSource {
    id: number
    url: string
    updateInterval: number
    dimensions: [number, number]
}

/**
 * A view from a satellite.
 */
interface SatelliteView {
    id: number
    name: string
    imageSources: ImageSource[]
    isThumbnail?: boolean
}

/**
 * A particular satellite.
 */
interface Satellite {
    id: number
    name: string
    views: SatelliteView[]
}

/**
 * Root satellite config object.
 */
interface RootSatelliteConfig {
    version: string
    satellites: Satellite[]
}
