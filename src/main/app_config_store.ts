/**
 * Module for managing the application config.
 */

import electronLog from 'electron-log'
import Store from 'electron-store'

const log = electronLog.scope('app-config-store')

const CURRENT_VIEW_ID_KEY = 'CURRENT_VIEW_ID'

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
}
