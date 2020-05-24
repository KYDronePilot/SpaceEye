import 'styled-components'

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            main: string
            headerBackground: string
            secondary: string
            background: string
        }

        elevation: {
            [key in 'low' | 'medium' | 'high']: {
                backgroundColor: string
                boxShadow: string
            }
        }
    }
}
