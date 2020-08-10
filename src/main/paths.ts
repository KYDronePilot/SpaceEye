/**
 * Paths to various files/directories needed throughout the application.
 */

import { app } from 'electron'
import Fs from 'fs'
import Path from 'path'

const USER_DATA_DIR = app.getPath('userData')
const imagesDir = Path.join(USER_DATA_DIR, 'downloaded_images')

// Create images dir if it doesn't already exist
if (!Fs.existsSync(imagesDir)) {
    Fs.mkdirSync(imagesDir)
}

export const IMAGES_DIR = imagesDir
