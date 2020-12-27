/**
 * Constants used throughout the application.
 */

// Max time to hold on to old downloaded images (in minutes)
export const IMAGE_RETENTION_TIME = 120

// Max time the update pipeline lock can be held (5 minutes)
export const LOCK_TIMEOUT = 5 * 60 * 1000

/**
 * Type of build of the application.
 */
export enum BuildType {
    /**
     * Any Mac target except MAS
     */
    mac = 'mac',

    /**
     * Any win target except Microsoft Store
     */
    win = 'win',

    /**
     * Mac App Store target
     */
    mas = 'mas',

    /**
     * Microsoft Store target
     */
    ms = 'ms',

    /**
     * An unknown build type
     */
    unknown = 'unknown'
}

/**
 * Get the application build type.
 *
 * @returns App build type
 */
function getBuildType(): BuildType {
    if (process.mas === true) {
        return BuildType.mas
    }
    if (process.windowsStore === true) {
        return BuildType.ms
    }
    if (process.platform === 'darwin') {
        return BuildType.mac
    }
    if (process.platform === 'win32') {
        return BuildType.win
    }
    return BuildType.unknown
}

export const BUILD_TYPE = getBuildType()
