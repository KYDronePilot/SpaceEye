import 'fontsource-roboto'

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@material-ui/core'
import { createMuiTheme, ThemeProvider as MuiThemeProvider } from '@material-ui/core/styles'
import { ipcRenderer as ipc } from 'electron-better-ipc'
import * as React from 'react'
import { HashRouter, Route } from 'react-router-dom'
import styled, { ThemeProvider } from 'styled-components'

import { GET_FIRST_RUN, SET_FIRST_RUN } from '../../shared/IpcDefinitions'
import { DarkTheme } from '../themes'
import HeaderBar from './HeaderBar'
import OnboardingHOC from './onboarding'
import Settings from './Settings'
import ThumbnailManager from './ThumbnailManager'

const Container = styled.div`
    --header-height: 50px;
    --thumbnails-height: calc(100vh - var(--toolbar-height));
    --toolbar-height: 0.001px;
    --background-color: ${props => props.theme.colors.background};
    --font-color: ${props => props.theme.colors.foreground};
    color: var(--font-color);
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
    background-color: var(--background-color);
    display: flex;
    flex-direction: column;
`

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            main: '#5297ff'
        }
    },
    typography: {
        allVariants: {
            color: 'white'
        }
    }
})

interface WindowsOnboardingDialogProps {
    show: boolean
    onDone: () => void
    onOpenSettings: () => void
}

const WindowsOnboardingDialog: React.FC<WindowsOnboardingDialogProps> = props => (
    <Dialog open={props.show} style={{ userSelect: 'none' }}>
        <DialogTitle>Welcome to SpaceEye!</DialogTitle>
        <DialogContent>
            <DialogContentText>
                To make sure the app icon is always visible in your taskbar, click the button below
                and select &quot;Show icon and notifications&quot; for &quot;SpaceEye&quot;.
            </DialogContentText>
            <DialogContentText>
                You can do this later by Windows searching for &quot;Select which icons appear on
                the taskbar&quot;
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={props.onDone}>Done</Button>
            <Button color="primary" onClick={props.onOpenSettings}>
                Open Icon Settings
            </Button>
        </DialogActions>
    </Dialog>
)

export interface ImagePickerPageState {
    isOnboarding: boolean
}

class ImagePickerPage extends React.Component<{}, ImagePickerPageState> {
    constructor(props: {}) {
        super(props)

        this.state = {
            isOnboarding: false
        }

        this.finishOnboarding = this.finishOnboarding.bind(this)
    }

    async componentDidMount() {
        // Check if we need to onboard the user
        const firstRun = await ipc.callMain<void, boolean>(GET_FIRST_RUN)
        this.setState({ isOnboarding: firstRun })
    }

    finishOnboarding() {
        this.setState({ isOnboarding: false })
        // No longer a first run after the user dismisses the message
        ipc.callMain<boolean>(SET_FIRST_RUN, false)
    }

    public render() {
        return (
            <Container>
                <HeaderBar />
                <ThumbnailManager />
                {/* <Toolbar /> */}
                <OnboardingHOC show={this.state.isOnboarding} onComplete={this.finishOnboarding} />
            </Container>
        )
    }
}

/**
 *
 */
function Main() {
    return (
        <HashRouter>
            <ThemeProvider theme={DarkTheme}>
                <MuiThemeProvider theme={theme}>
                    <div>
                        <Route exact path="/" component={ImagePickerPage} />
                        <Route path="/settings" component={Settings} />
                    </div>
                </MuiThemeProvider>
            </ThemeProvider>
        </HashRouter>
    )
}

export default Main
