// eslint-disable-next-line unused-imports/no-unused-imports-ts
import { Menubar } from 'menubar'

declare global {
    const APP_VERSION: string
    const APP_DESCRIPTION: string
    const APP_HOMEPAGE: string
    const APP_LICENSE: string
    const APP_BUGS_URL: string
    const mb: Menubar

    namespace NodeJS {
        interface Global {
            mb: Menubar
        }
    }
}
