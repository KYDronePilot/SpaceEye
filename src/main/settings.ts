import { app, Size } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
// import deepEqual from 'deep-equal'

/**
 * Settings directory.
 */
const SETTINGS_DIR = path.join(app.getPath('userData'), 'settings')

/**
 * Main settings file.
 */
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'main.json')

interface DisplayInformation {
    id: number
    size: Size
    colorDepth: number
}

/**
 * Settings for a particular display.
 */
export interface DisplaySettings extends DisplayInformation {
    isEnabled: boolean
    wallpaperPath?: string
}

export interface DisplayConfiguration {
    displaySettings: DisplaySettings[]
}

export interface Settings {
    version: string
    displayConfigurations: DisplayConfiguration[]
}

/**
 * Get a score determining how closely a display matches a display from a configuration.
 *
 * Score has same meaning as with `scoreDisplaysVsConfiguration` function.
 *
 * @param display - Display to score against the existing settings
 * @param settings - Existing display settings to score against
 * @returns Resulting score
 */
function scoreDisplayVsSettings(display: DisplayInformation, settings: DisplaySettings): number {
    // ID is the primary way of matching
    if (display.id === settings.id) {
        return 0
    }

    // Else, check size and color depth, with less confidence
    if (
        // deepEqual(display.size, settings.size, { strict: true }) &&
        display.colorDepth === settings.colorDepth
    ) {
        return 1
    }

    // Else, they aren't the same
    return -1
}

/**
 * Get a score determining how closely some displays match a configuration.
 *
 * How the score works:
 * - -1 == Cannot be a match
 * - 0 == Perfect match
 * - 1+ == Increasingly worse match
 *
 * @param displays - Displays to score against the configuration
 * @param configuration - Configuration to check against
 * @returns Resulting score
 */
function scoreDisplaysVsConfiguration(
    displays: DisplayInformation[],
    configuration: DisplayConfiguration
): number {
    // Cannot be the same configuration if different number of monitors
    if (displays.length !== configuration.displaySettings.length) {
        return -1
    }

    // Add up the scores
    let totalScore = 0
    for (let i = 0; i < displays.length; i += 1) {
        const score = scoreDisplayVsSettings(displays[i], configuration.displaySettings[i])
        // If screen and settings not compatible, match attempt is a failure
        if (score === -1) {
            return -1
        }
        totalScore += score
    }
    return totalScore
}

/**
 * Find a matching display configuration for some displays.
 *
 * @param displays - Displays to match with a configuration
 * @param configurations - Configurations to choose from
 * @returns Matching display configuration if a match is found, else undefined
 */
function findMatchingConfiguration(
    displays: DisplayInformation[],
    configurations: DisplayConfiguration[]
): DisplayConfiguration | undefined {
    if (configurations.length === 0) {
        return undefined
    }
    // Get the scores
    const scores = configurations.map(configuration =>
        scoreDisplaysVsConfiguration(displays, configuration)
    )

    // Get the minimum score
    const minScore = Math.min(...scores.filter(score => score !== -1))

    // Return the item furthest from the front with that score (latest added)
    for (let i = configurations.length - 1; i >= 0; i -= 1) {
        if (scores[i] === minScore) {
            return configurations[i]
        }
    }
    return undefined
}

export function readSettings(): Settings {
    const json = fs.readFileSync(SETTINGS_FILE, { encoding: 'utf8' })
    return JSON.parse(json)
}

export function saveSettings(settings: Settings): void {
    const json = JSON.stringify(settings)
    fs.writeFileSync(SETTINGS_FILE, json, { encoding: 'utf8' })
}
