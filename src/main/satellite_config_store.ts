/**
 * For storing/caching the satellite config.
 */
import Axios from 'axios'
import moment, { Moment } from 'moment'

// Time in seconds before invalidating the cached config.
const INVALIDATION_TIMEOUT = 60

// URL to download the config
const CONFIG_URL = 'https://kydronepilot.github.io/SpaceEyeSatelliteConfig/config.json'

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

    public static get Instance(): SatelliteConfigStore {
        if (this.instance === undefined) {
            this.instance = new this()
        }
        return this.instance
    }

    /**
     * Download and cache a new config.
     */
    private async updateConfig() {
        this.config = (await Axios.get<RootSatelliteConfig>(CONFIG_URL)).data
        this.lastUpdated = moment.utc()
    }

    /**
     * Get the satellite config.
     *
     * Checks the cache first. If the config doesn't exist there or is invalid,
     * a new config is downloaded.
     * @returns Satellite config
     */
    public async getConfig(): Promise<RootSatelliteConfig> {
        // Update if old or cached config doesn't exist
        if (
            this.config === undefined ||
            moment.utc().diff(this.lastUpdated!, 'seconds') > INVALIDATION_TIMEOUT
        ) {
            await this.updateConfig()
        }
        return this.config!
    }
}
