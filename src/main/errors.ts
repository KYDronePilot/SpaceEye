/**
 * Custom errors in the application.
 */

// eslint-disable-next-line max-classes-per-file
export class RequestCancelledError extends Error {}
export class LockNotHeldError extends Error {}
export class LockAcquisitionRejectedError extends Error {}
export class LockInvalidatedError extends Error {}
export class ViewNotSetError extends Error {}
export class ViewConfigAccessError extends Error {}
export class RequestError extends Error {}
export class FileDoesNotExistError extends Error {}
export class MonitorConfigChangedError extends Error {}
