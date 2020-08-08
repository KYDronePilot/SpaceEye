/**
 * Module for managing the application config.
 */

import Store from 'electron-store'

const CURRENT_VIEW_ID_KEY = 'CURRENT_VIEW_ID'

export class AppConfigStore {
    private static store = new Store()

    public static get currentViewId(): number | undefined {
        return AppConfigStore.store.get(CURRENT_VIEW_ID_KEY) as number | undefined
    }

    public static set currentViewId(value: number | undefined) {
        AppConfigStore.store.set(CURRENT_VIEW_ID_KEY, value)
    }
}
