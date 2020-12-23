/* eslint-disable max-classes-per-file */
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    MobileStepper
} from '@material-ui/core'
import { KeyboardArrowLeft } from '@material-ui/icons'
import { ipcRenderer as ipc } from 'electron-better-ipc'
import * as React from 'react'
import { FC } from 'react'
import styled from 'styled-components'

import macosMenubar from '../../../img/macos_menubar_icon.png'
import windowsAlwaysShowIcon from '../../../img/windows_always_show_icon.png'
import windowsIconAppearance from '../../../img/windows_icon_appearance.png'
import windowsMenubar from '../../../img/windows_menubar_icon.png'
import windowsOverflow from '../../../img/windows_overflow_icon.png'
import {
    OPEN_WINDOWS_ICON_SETTINGS,
    SET_AUTO_UPDATE,
    SET_START_ON_LOGIN
} from '../../../shared/IpcDefinitions'

const MenubarImg = styled.img`
    width: 400px;
    padding-bottom: 10px;
`

interface OnboardingPageProps {
    index: number
    next: () => void
    previous: () => void
    addPage: (page: OnboardingPage, index: number) => void
    removePage: (page: OnboardingPage, index: number) => void
}

type OnboardingPage = FC<OnboardingPageProps>

const IntroductionMac: OnboardingPage = props => {
    return (
        <>
            <DialogTitle>Welcome to SpaceEye!</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Once you select a view, SpaceEye runs in the background, continually updating to
                    the latest imagery.
                </DialogContentText>
                <DialogContentText>
                    To access this window, click the globe icon in your menu bar, as shown below:
                </DialogContentText>
                <div style={{ textAlign: 'center' }}>
                    <MenubarImg src={macosMenubar} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Button variant="contained" color="primary" onClick={props.next}>
                        Got it!
                    </Button>
                </div>
            </DialogContent>
        </>
    )
}

const IntroductionWindows: OnboardingPage = props => {
    return (
        <>
            <DialogTitle>Welcome to SpaceEye!</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Once you select a view, SpaceEye runs in the background, continually updating to
                    the latest imagery.
                </DialogContentText>
                <DialogContentText>
                    To access this window, click the globe icon in the notification area of your
                    taskbar, as shown below:
                </DialogContentText>
                <div style={{ textAlign: 'center' }}>
                    <MenubarImg src={windowsMenubar} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Button variant="contained" color="primary" onClick={props.next}>
                        Got it!
                    </Button>
                </div>
            </DialogContent>
        </>
    )
}

const WindowsAlwaysShowIconTutorial: OnboardingPage = props => {
    return (
        <>
            <DialogContent>
                <DialogContentText>
                    Click below to open the Windows Taskbar settings:
                </DialogContentText>
                <div style={{ textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => ipc.callMain(OPEN_WINDOWS_ICON_SETTINGS)}
                    >
                        Open taskbar settings
                    </Button>
                </div>
                <Box my={1.5} />
                <DialogContentText>
                    Scroll down until you see the button &quot;Select which icons appear on the
                    taskbar&quot; and click on it:
                </DialogContentText>
                <div style={{ textAlign: 'center' }}>
                    <MenubarImg src={windowsIconAppearance} />
                </div>
                <DialogContentText>
                    Find &quot;SpaceEye&quot; in the list and turn it on:
                </DialogContentText>
                <div style={{ textAlign: 'center' }}>
                    <MenubarImg src={windowsAlwaysShowIcon} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <Button variant="contained" color="primary" onClick={props.next}>
                        Next
                    </Button>
                </div>
            </DialogContent>
        </>
    )
}

const WindowsHiddenIconExplanation: OnboardingPage = props => {
    return (
        <>
            <DialogTitle>Configure SpaceEye to always be in the taskbar?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    By default, Windows hides the SpaceEye icon after a few minutes and moves it to
                    the overflow area, accessible by clicking the arrow (^), as shown below:
                </DialogContentText>
                <div style={{ textAlign: 'center' }}>
                    <MenubarImg src={windowsOverflow} />
                </div>
                <DialogContentText>
                    Would you like to configure the SpaceEye icon to always be in the taskbar?
                </DialogContentText>
                <Grid container direction="column" justify="center" alignItems="center">
                    <Box my={0.5} />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            props.addPage(WindowsAlwaysShowIconTutorial, props.index + 1)
                            props.next()
                        }}
                    >
                        Yes
                    </Button>
                    <Box my={0.5} />
                    <Button
                        variant="text"
                        color="default"
                        onClick={() => {
                            props.removePage(WindowsAlwaysShowIconTutorial, props.index + 1)
                            props.next()
                        }}
                    >
                        No, thanks
                    </Button>
                </Grid>
            </DialogContent>
        </>
    )
}

const AllowStartOnLoginPage: OnboardingPage = props => {
    return (
        <>
            <DialogTitle>Allow SpaceEye to start automatically?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    If you have to restart your computer or log out/log back in, SpaceEye can
                    automatically start and continue running in the background.
                </DialogContentText>
                <Grid container direction="column" justify="center" alignItems="center">
                    <Box my={0.5} />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            ipc.callMain<boolean>(SET_START_ON_LOGIN, true)
                            props.next()
                        }}
                    >
                        Yes
                    </Button>
                    <Box my={0.5} />
                    <Button
                        variant="text"
                        color="default"
                        onClick={() => {
                            ipc.callMain<boolean>(SET_START_ON_LOGIN, false)
                            props.next()
                        }}
                    >
                        No, thanks
                    </Button>
                </Grid>
            </DialogContent>
        </>
    )
}

const AllowAutoUpdatePage: OnboardingPage = props => {
    return (
        <>
            <DialogTitle>Allow SpaceEye to update automatically?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    SpaceEye can automatically download and update to its latest version in the
                    background while running.
                </DialogContentText>
                <DialogContentText>
                    Otherwise, SpaceEye will still download updates, but you will be prompted on
                    whether to install them.
                </DialogContentText>
                <Grid container direction="column" justify="center" alignItems="center">
                    <Box my={0.5} />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            ipc.callMain<boolean>(SET_AUTO_UPDATE, true)
                            props.next()
                        }}
                    >
                        Allow automatic updates
                    </Button>
                    <Box my={0.5} />
                    <Button
                        variant="text"
                        color="default"
                        onClick={() => {
                            ipc.callMain<boolean>(SET_AUTO_UPDATE, false)
                            props.next()
                        }}
                    >
                        Notify me of updates
                    </Button>
                </Grid>
            </DialogContent>
        </>
    )
}

const GetStartedPage: OnboardingPage = props => {
    return (
        <>
            <DialogTitle>That&lsquo;s it!</DialogTitle>
            <DialogContent>
                <Box textAlign="center" mx={10} mt={1} mb={3}>
                    <Button variant="contained" color="primary" onClick={props.next}>
                        Get Started
                    </Button>
                </Box>
            </DialogContent>
        </>
    )
}

const MAC_BASE_PAGES: OnboardingPage[] = [IntroductionMac, AllowStartOnLoginPage, GetStartedPage]
const WINDOWS_BASE_PAGES: OnboardingPage[] = [
    IntroductionWindows,
    WindowsHiddenIconExplanation,
    AllowStartOnLoginPage,
    GetStartedPage
]

export interface OnboardingHOCProps {}

export interface OnboardingHOCState {
    currentIndex: number
    pages: OnboardingPage[]
}

export default class OnboardingHOC extends React.Component<OnboardingHOCProps, OnboardingHOCState> {
    constructor(props: OnboardingHOCProps) {
        super(props)

        const pages = process.platform !== 'darwin' ? MAC_BASE_PAGES : WINDOWS_BASE_PAGES
        // Add auto update page if GitHub download
        if (process.mas !== true && process.windowsStore !== true) {
            pages.splice(pages.length - 1, 0, AllowAutoUpdatePage)
        }

        this.state = {
            currentIndex: 0,
            pages
        }
        this.count = this.count.bind(this)
        this.decrement = this.decrement.bind(this)
        this.increment = this.increment.bind(this)
        this.addPage = this.addPage.bind(this)
        this.removePage = this.removePage.bind(this)
    }

    private count(): number {
        return this.state.pages.length
    }

    private decrement() {
        this.setState(state => ({ currentIndex: Math.max(0, state.currentIndex - 1) }))
    }

    private increment() {
        this.setState(state => ({
            currentIndex: Math.min(this.count() - 1, state.currentIndex + 1)
        }))
    }

    private addPage(page: OnboardingPage, index: number) {
        if (this.state.pages[index] === page) {
            return
        }
        this.setState(state => {
            state.pages.splice(index, 0, page)
            return {
                pages: state.pages
            }
        })
    }

    private removePage(page: OnboardingPage, index: number) {
        if (this.state.pages[index] !== page) {
            return
        }
        this.setState(state => {
            state.pages.splice(index, 1)
            return {
                pages: state.pages
            }
        })
    }

    public render() {
        return (
            <Dialog open={true} style={{ userSelect: 'none' }}>
                {this.state.pages
                    .filter((_, index) => this.state.currentIndex === index)
                    .map(Page => (
                        <Page
                            index={this.state.currentIndex}
                            next={this.increment}
                            previous={this.decrement}
                            key={this.state.currentIndex}
                            addPage={this.addPage}
                            removePage={this.removePage}
                        />
                    ))}
                <MobileStepper
                    variant="dots"
                    steps={this.count()}
                    position="static"
                    activeStep={this.state.currentIndex}
                    nextButton={<Box mx={5} my={2} />}
                    backButton={
                        this.state.currentIndex !== 0 ? (
                            <Button size="small" onClick={this.decrement}>
                                <KeyboardArrowLeft />
                                Back
                            </Button>
                        ) : (
                            <Box mx={5} my={2} />
                        )
                    }
                />
            </Dialog>
        )
    }
}
