import { DefaultTheme } from 'styled-components'

export const DarkTheme: DefaultTheme = {
    colors: {
        background: 'rgb(34, 34, 34)',
        headerBackground: 'rgb(30, 30, 30)',
        foreground: 'white',
        borderHighlight: 'rgb(0, 80, 196)',
        main: '',
        secondary: ''
    },

    elevation: {
        low: {
            backgroundColor: 'rgb(41, 41, 41)',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.3)'
        },
        medium: {
            backgroundColor: 'test',
            boxShadow: 'test'
        },
        high: {
            backgroundColor: 'test',
            boxShadow: 'test'
        }
    }
}

export const LightTheme: DefaultTheme = {
    colors: {
        background: 'rgb(230, 230, 230)',
        headerBackground: 'rgb(230, 230, 230)',
        foreground: 'black',
        borderHighlight: 'rgb(0, 91, 215)',
        main: '',
        secondary: ''
    },

    elevation: {
        low: {
            backgroundColor: 'rgb(235, 235, 235)',
            boxShadow: '0 3px 7px rgba(0, 0, 0, 0.3)'
        },
        medium: {
            backgroundColor: 'test',
            boxShadow: 'test'
        },
        high: {
            backgroundColor: 'test',
            boxShadow: 'test'
        }
    }
}
