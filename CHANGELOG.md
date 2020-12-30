# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2]

### Fixed

- CI bug that crashed anyone who installed release 1.1.1.

## [1.1.1]

### Fixed

- Mac toolbar icons weren't being treated as template images, causing them to
  look invisible when in light mode.

## [1.1.0]

### Added

- Onboarding steps for new users, to explain how the app works and to prompt for
  basic settings options.

### Fixed

- Periodic background updates were taking longer than they should have.
- Bug that would have allowed MAS and Windows Store builds to try auto updating.

## [1.0.0]

### Added

- Option to enabled/disable start on login.
- Onboarding info for Windows users.
- Full-auto update option for GitHub Releases builds.
- App icons.
- Progress bar when downloading new satellite images.

### Changed

- Window is no longer draggable.
- Improved look of settings page.
- Don't update image if screen is locked.
- Update the image on app start.
- Removed dependencies that were not needed.
- Added "About" section in settings with open source license info.
- Increased redundancy when making web requests.
- Better overall error handling when making web requests.
- Improved response time when viewing window right after launching.

### Fixed

- Optimal image size for all monitors will now be downloaded, instead of just
  the largest.
- Fixed security vulnerabilities.
- Ensure only one instance of the app is ever opened.
- Window is now positioned correctly when Windows Toolbar is not at the bottom
  of the screen.
- Full disk images are no longer cut off by scaling.

## [0.1.0]

### Added

- Auto-update functionality, using automated [GitHub
  Releases](https://github.com/KYDronePilot/SpaceEye/releases).
- Logging throughout the application to aid in finding and fixing errors.
- Thumbnails now update when the app window is opened.
- Current view is highlighted when the app is opened.

### Changed

- Made the window non-resizable.

### Fixed

- Cancelled downloads were being handled as unknown errors.
