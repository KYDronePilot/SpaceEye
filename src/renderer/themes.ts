import { DefaultTheme } from 'styled-components';

export const DarkTheme: DefaultTheme = {
    colors: {
        background: 'rgb(34, 34, 34)',
        headerBackground: 'rgb(34, 34, 34)',
        main: '',
        secondary: ''
    },

    elevation: {
        low: {
            backgroundColor: 'test',
            boxShadow: '0 0 20px black'
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
};

export const LightTheme: DefaultTheme = {
    colors: {
        background: 'rgb(230, 230, 230)',
        headerBackground: 'rgb(230, 230, 230)',
        main: '',
        secondary: ''
    },

    elevation: {
        low: {
            backgroundColor: 'test',
            boxShadow: '0 0 15px rgba(0, 0, 0, 0.5)'
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
};
