/**
 * For storing/caching the satellite config.
 */
import AsyncLock from 'async-lock'
import Axios from 'axios'
import electronLog from 'electron-log'
import moment, { Moment } from 'moment'

import {
    ImageSource,
    RootSatelliteConfig,
    Satellite,
    SatelliteView,
    version as configVersion
} from '../shared/config_types'
import { RequestError } from './errors'

const log = electronLog.scope('satellite-config-store')

// Time in seconds before invalidating the cached config.
const INVALIDATION_TIMEOUT = 900

// URL to download the config
const CONFIG_URL = `https://spaceeye-satellite-configs.s3.us-east-2.amazonaws.com/${configVersion}/config.json`

// Async lock
const lock = new AsyncLock()

export class SatelliteConfigStore {
    private static instance?: SatelliteConfigStore

    /**
     * Last time config was updated
     */
    lastUpdated?: Moment

    /**
     * The config
     */
    config?: RootSatelliteConfig

    /**
     * ETag for currently downloaded config
     */
    etag?: string

    /**
     * Domains that should not be probed via HTTP HEAD requests before requesting.
     */
    dnsProbeOverrideDomains?: string[]

    public static get Instance(): SatelliteConfigStore {
        if (this.instance === undefined) {
            this.instance = new this()
        }
        return this.instance
    }

    /**
     * Download and cache a new config.
     *
     * @throws {RequestError} if there is an error while fetching the config
     */
    private async updateConfig() {
        log.debug('Updating satellite config')
        try {
            const response = await Axios.get<RootSatelliteConfig>(CONFIG_URL, {
                headers: { 'If-None-Match': this.etag ?? '' },
                validateStatus: status => (status >= 200 && status < 300) || status === 304
            })
            // ETags don't match
            if (response.status !== 304) {
                log.debug('Setting new config; ETag has changed')
                this.config = response.data
                this.etag = response.headers.etag ?? undefined
                this.dnsProbeOverrideDomains = this.config.dnsHttpProbeOverride
            } else {
                log.debug('ETag is the same; keeping old config')
            }
        } catch (error) {
            log.info('Satellite config update failed')
            throw new RequestError('Error while fetching the satellite config')
        }
        this.lastUpdated = moment.utc()
    }

    /**
     * Get the satellite config, no locking mechanism.
     *
     * Checks the cache first. If the config doesn't exist there or is invalid,
     * a new config is downloaded.
     *
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite config
     */
    private async getConfigUnsafe(): Promise<RootSatelliteConfig> {
        // Update if old or cached config doesn't exist
        if (
            this.config === undefined ||
            moment.utc().diff(this.lastUpdated!, 'seconds') > INVALIDATION_TIMEOUT
        ) {
            await this.updateConfig()
        }
        return this.config!
    }

    /**
     * Wrapper for `getConfigUnsafe` with locking mechanism to prevent
     * concurrent updates.
     *
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite config
     */
    public async getConfig(): Promise<RootSatelliteConfig> {
        return lock.acquire('get-config', async () => {
            return this.getConfigUnsafe()
        })
    }

    /**
     * Get a satellite config by its ID.
     *
     * @param satelliteId - ID of the satellite
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite config
     */
    public async getSatelliteById(satelliteId: number): Promise<Satellite | undefined> {
        const config = await this.getConfig()
        for (const satellite of config.satellites) {
            if (satellite.id === satelliteId) {
                return satellite
            }
        }
        return undefined
    }

    /**
     * Get a satellite and satellite view config by a satellite view ID.
     *
     * @param viewId - ID of the view
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite and view config
     */
    private async getSatelliteAndViewById(
        viewId: number
    ): Promise<{ satellite: Satellite; view: SatelliteView } | undefined> {
        const config = await this.getConfig()
        for (const satellite of config.satellites) {
            for (const view of satellite.views) {
                if (view.id === viewId) {
                    return { satellite, view }
                }
            }
        }
        return undefined
    }

    /**
     * Get a satellite, satellite view, and image source config by an image
     * source ID.
     *
     * @param imageId - ID of the image
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite, view, and image config
     */
    private async getSatelliteViewAndImageById(
        imageId: number
    ): Promise<{ satellite: Satellite; view: SatelliteView; image: ImageSource } | undefined> {
        const config = await this.getConfig()
        for (const satellite of config.satellites) {
            for (const view of satellite.views) {
                for (const image of view.imageSources) {
                    if (image.id === imageId) {
                        return { satellite, view, image }
                    }
                }
            }
        }
        return undefined
    }

    /**
     * Get a satellite view config by its ID.
     *
     * @param viewId - ID of the view
     * @throws {RequestError} if there is an error while fetching the config
     * @returns View config
     */
    public async getViewById(viewId: number): Promise<SatelliteView | undefined> {
        return (await this.getSatelliteAndViewById(viewId))?.view
    }

    /**
     * Get an image source config by its ID.
     *
     * @param imageId - ID of the image
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Image config
     */
    public async getImageById(imageId: number): Promise<ImageSource | undefined> {
        return (await this.getSatelliteViewAndImageById(imageId))?.image
    }

    /**
     * Get a satellite view config by an image source ID.
     *
     * @param imageId - ID of the image
     * @throws {RequestError} if there is an error while fetching the config
     * @returns View config containing the image
     */
    public async getViewByImageId(imageId: number): Promise<SatelliteView | undefined> {
        return (await this.getSatelliteViewAndImageById(imageId))?.view
    }

    /**
     * Get a satellite config by an image source ID.
     *
     * @param imageId - ID of the image
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite config containing the image
     */
    public async getSatelliteByImageId(imageId: number): Promise<Satellite | undefined> {
        return (await this.getSatelliteViewAndImageById(imageId))?.satellite
    }

    /**
     * Get a satellite config by a satellite view ID.
     *
     * @param viewId - ID of the view
     * @throws {RequestError} if there is an error while fetching the config
     * @returns Satellite config containing the view
     */
    public async getSatelliteByViewId(viewId: number): Promise<Satellite | undefined> {
        return (await this.getSatelliteAndViewById(viewId))?.satellite
    }
}
