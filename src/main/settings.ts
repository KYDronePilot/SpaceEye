import {app} from 'electron';
import * as path from 'path'
import * as fs from 'fs';

/**
 * Settings directory.
 */
const SETTINGS_DIR = path.join(app.getPath('userData'), 'settings');

/**
 * Main settings file.
 */
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'main.json')

/**
 * Settings for a particular display.
 */
export interface DisplaySettings {
    /**
     * Electron.js ID for display.
     */
    id: number

    /**
     * Should wallpaper be managed by application.
     */
    isEnabled: boolean

    /**
     * Path to the current wallpaper image which should be displayed.
     */
    wallpaperPath?: string
}

/**
 * Root settings for the application.
 */
export interface Settings {
    /**
     * Version of the config.
     */
    version: string

    /**
     * Settings for each of the displays.
     */
    displaySettings: DisplaySettings[]
}

export function readSettings(): Settings {
    const json = fs.readFileSync(SETTINGS_FILE, {encoding: 'utf8'});
    return JSON.parse(json);
}

export function saveSettings(settings: Settings): void {
    const json = JSON.stringify(settings);
    fs.writeFileSync(SETTINGS_FILE, json, {encoding: 'utf8'});
}
