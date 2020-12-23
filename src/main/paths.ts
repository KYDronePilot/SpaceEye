/**
 * Paths to various files/directories needed throughout the application.
 */

import { app } from 'electron'
import Fs from 'fs'
import { sync as globSync } from 'glob'
import Path from 'path'

const APP_DATA_DIR = app.getPath('appData')
const USER_DATA_DIR = app.getPath('userData')
const imagesDir = Path.join(USER_DATA_DIR, 'downloaded_images')

// Create images dir if it doesn't already exist
if (!Fs.existsSync(imagesDir)) {
    Fs.mkdirSync(imagesDir)
}

export const IMAGES_DIR = imagesDir

// Alternate "non-virtualized" locations of downloaded image files for UWP (Windows Store) builds
export const UWP_IMAGE_DIRS =
    process.windowsStore === true
        ? globSync(
              `${APP_DATA_DIR}/../Local/Packages/43181KYDronePilot.SpaceEye_*/LocalCache/Roaming/space-eye/downloaded_images`
          )
        : []
