/**
 * Module for managing the application config.
 */

import electronLog from 'electron-log'
import Store from 'electron-store'

const log = electronLog.scope('app-config-store')

const CURRENT_VIEW_ID_KEY = 'CURRENT_VIEW_ID'
const START_ON_LOGIN_KEY = 'START_ON_LOGIN'
const FIRST_RUN_KEY = 'FIRST_RUN'
const AUTO_UPDATE_KEY = 'AUTO_UPDATE'

export class AppConfigStore {
    private static store = new Store()

    public static get currentViewId(): number | undefined {
        const currentViewId = AppConfigStore.store.get(CURRENT_VIEW_ID_KEY) as number | undefined
        log.debug('Current view ID retrieved:', currentViewId)
        return currentViewId
    }

    public static set currentViewId(value: number | undefined) {
        log.debug('Setting current view ID to:', value)
        AppConfigStore.store.set(CURRENT_VIEW_ID_KEY, value)
    }

    public static get startOnLogin(): boolean | undefined {
        const startOnLogin = AppConfigStore.store.get(START_ON_LOGIN_KEY) as boolean | undefined
        log.debug('Start on login retrieved:', startOnLogin)
        return startOnLogin
    }

    public static set startOnLogin(value: boolean | undefined) {
        log.debug('Setting start on login to:', value)
        AppConfigStore.store.set(START_ON_LOGIN_KEY, value)
    }

    public static get firstRun(): boolean {
        const firstRun = AppConfigStore.store.get(FIRST_RUN_KEY) as boolean | undefined
        log.debug('First run retrieved:', firstRun)
        return firstRun ?? true
    }

    public static set firstRun(value: boolean) {
        log.debug('Setting first run to:', value)
        AppConfigStore.store.set(FIRST_RUN_KEY, value)
    }

    public static get autoUpdate(): boolean {
        const autoUpdate = AppConfigStore.store.get(AUTO_UPDATE_KEY, true) as boolean
        log.debug('Auto update retrieved:', autoUpdate)
        return autoUpdate
    }

    public static set autoUpdate(value: boolean) {
        log.debug('Setting auto update to:', value)
        AppConfigStore.store.set(AUTO_UPDATE_KEY, value)
    }
}
