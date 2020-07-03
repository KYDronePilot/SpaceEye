import 'styled-components'

declare module 'styled-components' {
    export interface DefaultTheme {
        colors: {
            background: string
            headerBackground: string
            foreground: string
            borderHighlight: string
            main: string
            secondary: string
        }

        elevation: {
            [key in 'low' | 'medium' | 'high']: {
                backgroundColor: string
                boxShadow: string
            }
        }
    }
}
