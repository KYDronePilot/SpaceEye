/**
 * Custom errors in the application.
 */

// eslint-disable-next-line max-classes-per-file
export class RequestCancelledError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'RequestCancelledError'
    }
}
export class LockNotHeldError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'LockNotHeldError'
    }
}
export class LockAcquisitionRejectedError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'LockAcquisitionRejectedError'
    }
}
export class LockInvalidatedError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'LockInvalidatedError'
    }
}
export class ViewNotSetError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'ViewNotSetError'
    }
}
export class ViewConfigAccessError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'ViewConfigAccessError'
    }
}
export class RequestError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'RequestError'
    }
}
export class FileDoesNotExistError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'FileDoesNotExistError'
    }
}
export class MonitorConfigChangedError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = 'MonitorConfigChangedError'
    }
}
