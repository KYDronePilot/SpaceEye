import Axios, { CancelTokenSource } from 'axios'
import { clearTimeout, setTimeout } from 'timers'

import { LOCK_TIMEOUT } from './consts'
import { LockNotHeldError } from './errors'

/**
 * The lock data given back to the requester.
 */
export interface Lock {
    id: number
}

/**
 * The initiators who can request a lock.
 */
export enum Initiator {
    /**
     * The user, requesting a different image be displayed
     */
    user,

    /**
     * A watcher function which gets triggered when the display config changes
     */
    displayChangeWatcher,

    /**
     * The heartbeat function which is triggered at a normal interval to make
     * sure everything is working as it should.
     */
    heartbeatFunction
}

/**
 * Locking mechanism to prevent race conditions when updating background
 * wallpaper.
 */
export class UpdateLock {
    // Current active lock on the update pipeline, if any
    private static activeLock?: UpdateLock

    // Initiator of the update
    private initiator: Initiator

    // Lock invalidation timeout instance (for cancelling the timeout function)
    private lockTimeout: NodeJS.Timeout

    // Key-mapped download cancel tokens for a lock
    private downloadCancelTokens: Set<CancelTokenSource>

    private constructor(initiator: Initiator) {
        this.initiator = initiator
        this.downloadCancelTokens = new Set()
        this.lockTimeout = setTimeout(() => {
            this.invalidate()
        }, LOCK_TIMEOUT)
    }

    /**
     * Should a new lock be granted to an initiator, given the current lock.
     *
     * @param currentLock - The current lock
     * @param newInitiator - Initiator requesting a new lock
     * @returns Whether a new lock should be granted
     */
    // eslint-disable-next-line consistent-return
    private static shouldGrantNewLock(currentLock: UpdateLock, newInitiator: Initiator): boolean {
        // eslint-disable-next-line default-case
        switch (newInitiator) {
            case Initiator.user:
                return true
            case Initiator.heartbeatFunction:
                return false
            case Initiator.displayChangeWatcher:
                return true
        }
    }

    /**
     * Attempt to acquire a lock on the update pipeline.
     *
     * If there is already an update with higher precedence, `undefined` will be
     * returned, meaning a lock could not be acquired.
     *
     * If this acquisition takes precedent over one in progress, the one in
     * progress will be invalidated and a new lock will be granted.
     *
     * @param initiator - The initiator of the update
     * @returns A lock if it can be acquired, else `undefined`
     */
    public static acquire(initiator: Initiator): UpdateLock | undefined {
        if (UpdateLock.activeLock !== undefined) {
            if (!UpdateLock.shouldGrantNewLock(UpdateLock.activeLock, initiator)) {
                return undefined
            }
            UpdateLock.activeLock.invalidate()
        }
        UpdateLock.activeLock = new this(initiator)
        return UpdateLock.activeLock
    }

    /**
     * Invalidate the lock.
     */
    public invalidate(): void {
        // Cancel any download tokens and release
        this.downloadCancelTokens.forEach(token => token.cancel())
        this.release()
    }

    /**
     * Generate a new Axios download cancel token.
     *
     * @throws {LockNotHeldError} if lock is no longer held
     * @returns New cancel token
     */
    public generateCancelToken(): CancelTokenSource {
        if (!this.isStillHeld()) {
            throw new LockNotHeldError()
        }
        const token = Axios.CancelToken.source()
        this.downloadCancelTokens.add(token)
        return token
    }

    /**
     * Remove reference to a token.
     *
     * @param token - Token to remove
     */
    public destroyCancelToken(token: CancelTokenSource): void {
        this.downloadCancelTokens.delete(token)
    }

    /**
     * Check if the update pipeline lock is still held.
     *
     * @returns Whether the lock is still held
     */
    public isStillHeld(): boolean {
        return this === UpdateLock.activeLock
    }

    /**
     * Release lock on the download pipeline.
     */
    public release(): void {
        clearTimeout(this.lockTimeout)
        if (this === UpdateLock.activeLock) {
            UpdateLock.activeLock = undefined
        }
    }
}
