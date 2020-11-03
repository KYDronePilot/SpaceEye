/* eslint-disable jsx-a11y/anchor-is-valid */
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    Link,
    Switch,
    Typography
} from '@material-ui/core'
import { shell } from 'electron'
import path from 'path'
import * as React from 'react'
import { Redirect } from 'react-router-dom'
import styled from 'styled-components'

import {
    GET_AUTO_UPDATE,
    GET_START_ON_LOGIN,
    GetAutoUpdateIpcResponse,
    GetStartOnLoginIpcResponse,
    QUIT_APPLICATION_CHANNEL,
    SET_AUTO_UPDATE,
    SET_START_ON_LOGIN,
    SetAutoUpdateIpcParams,
    SetStartOnLoginIpcParams
} from '../../shared/IpcDefinitions'
import { ipcRequest } from '../IpcService'

const SectionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    flex-basis: var(--sections-column-width);
    align-items: flex-start;
    justify-content: flex-end;
    background-color: rgb(48, 48, 48);
`

const SectionsColumn = styled.div`
    display: flex;
    flex-direction: column;
    width: var(--sections-column-width);
    height: 100%;
`

const SettingsColumn = styled.div`
    flex-grow: 1;
    flex-basis: 400px;
`

const Row = styled.div`
    display: flex;
    flex-direction: row;
`

const ProductTitle = styled.h1`
    font-family: Roboto, sans-serif;
    font-size: 25px;
    font-weight: normal;
    letter-spacing: 0.15px;
    color: white;
`

const SettingsHeader = styled.h2`
    font-family: Roboto, sans-serif;
    font-size: 20px;
    font-weight: normal;
    letter-spacing: 0.15px;
    color: white;
`

const Spacer = styled.div`
    flex-grow: 1;
`

const SettingsContainer = styled.div`
    --top-padding: 75px;
    --sections-column-width: 200px;
    --settings-column-width: 400px;
    display: flex;
    flex-direction: row;
    height: 100%;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
`

const QuitButton = styled.button`
    text-decoration: none;
    appearance: none;
    outline: none;
    cursor: pointer;
    margin: 20px 0;
    background: transparent;
    border: 1px solid red;
    border-radius: 5px;
    color: red;
    padding: 8px 17px;
    font-family: Roboto, sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 0.15px;
`

const BackButton = styled.button`
    --button-color: #0075ff;
    text-decoration: none;
    appearance: none;
    outline: none;
    cursor: pointer;
    margin: 20px 0;
    background: transparent;
    border-width: 1px;
    border-style: solid;
    border-radius: 5px;
    border-color: var(--button-color);
    color: var(--button-color);
    padding: 8px 17px;
    font-family: Roboto, sans-serif;
    font-size: 16px;
    font-weight: normal;
    letter-spacing: 0.15px;
`

interface SettingsSwitchProps {
    label: string
    isChecked: boolean
    onChange: (isChecked: boolean) => void
}

const SettingsSwitch: React.FC<SettingsSwitchProps> = props => {
    const { label, isChecked, onChange } = props
    return (
        <FormControl component="fieldset">
            <FormControlLabel
                control={
                    <Switch
                        checked={isChecked}
                        onChange={(_, checked) => onChange(checked)}
                        name={label}
                        color="primary"
                    />
                }
                label={label}
                labelPlacement="top"
            />
        </FormControl>
    )
}

const AppIcon = styled.img`
    width: 70px;
    height: 70px;
    margin-left: auto;
    margin-right: auto;
`

interface AboutThisAppProps {
    onClickDone: () => void
    visible: boolean
}

const AboutThisApp: React.FC<AboutThisAppProps> = props => {
    return (
        <Dialog open={props.visible} style={{ userSelect: 'none', textAlign: 'center' }}>
            <DialogContent>
                <AppIcon
                    src="https://miro.medium.com/max/1000/1*_bq2g7Lo2RjWi98i5l75Wg.png"
                    alt="SpaceEye icon"
                />
                <Typography variant="h6">SpaceEye</Typography>
                <Typography variant="body2" style={{ userSelect: 'text' }}>
                    Version {APP_VERSION}
                </Typography>
                <Typography variant="body2">Copyright (c) 2020 Michael Galliers</Typography>
                <Typography variant="body2">License: {APP_LICENSE}</Typography>
                <Link
                    component="button"
                    variant="body2"
                    onClick={() => shell.openExternal(APP_BUGS_URL)}
                >
                    Report bugs
                </Link>
                <DialogActions>
                    <Button
                        onClick={() =>
                            shell.openPath(path.join(process.resourcesPath, 'legal_notices.txt'))
                        }
                    >
                        Acknowledgements
                    </Button>
                    <Button onClick={props.onClickDone}>Done</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}

interface SettingsProps {
    onClickBack: () => void
    onClickQuit: () => void
    onClickStartOnLoginSwitch: (shouldStart: boolean) => void
    onClickAutoUpdateSwitch: (autoUpdate: boolean) => void
    openAboutApp: () => void
    closeAboutApp: () => void
    shouldStartOnLogin: boolean
    autoUpdate: boolean
    aboutAppVisible: boolean
}

const Settings: React.FC<SettingsProps> = props => {
    const {
        onClickBack,
        onClickQuit,
        onClickStartOnLoginSwitch,
        onClickAutoUpdateSwitch,
        openAboutApp,
        closeAboutApp,
        shouldStartOnLogin,
        autoUpdate,
        aboutAppVisible
    } = props

    return (
        <SettingsContainer>
            <SectionsContainer>
                <SectionsColumn>
                    <Box my={1} />
                    <Grid container direction="row" justify="center">
                        <Typography variant="h5">SpaceEye</Typography>
                    </Grid>
                    <Box my={1} />
                    <Grid container direction="row" justify="center">
                        <Button variant="outlined" color="primary" onClick={onClickBack}>
                            Back
                        </Button>
                    </Grid>
                    <Spacer />
                    <Grid container direction="column" justify="center" alignItems="center">
                        <Link
                            component="button"
                            variant="body2"
                            color="textSecondary"
                            onClick={openAboutApp}
                        >
                            About
                        </Link>
                        <Box my={0.5} />
                        <Button variant="outlined" color="secondary" onClick={onClickQuit}>
                            Quit
                        </Button>
                    </Grid>
                    <Box my={1} />
                </SectionsColumn>
            </SectionsContainer>
            <SettingsColumn>
                <Box my={2} />
                <Grid container direction="row" justify="center">
                    <Typography variant="h6">Settings</Typography>
                </Grid>
                <Box my={2} mx={1}>
                    <Divider variant="fullWidth" />
                </Box>
                <Grid container direction="column" justify="flex-start" alignContent="flex-start">
                    <SettingsSwitch
                        isChecked={shouldStartOnLogin}
                        onChange={onClickStartOnLoginSwitch}
                        label="Start on Login"
                    />
                    {/* Don't show auto-update option if downloaded from an app store */}
                    {!process.mas && !process.windowsStore && (
                        <SettingsSwitch
                            isChecked={autoUpdate}
                            onChange={onClickAutoUpdateSwitch}
                            label="Auto update"
                        />
                    )}
                </Grid>
            </SettingsColumn>
            <AboutThisApp onClickDone={closeAboutApp} visible={aboutAppVisible} />
        </SettingsContainer>
    )
}

interface SettingsManagerState {
    backCLicked: boolean
    startOnLogin: boolean
    autoUpdate: boolean
    isLoaded: boolean
    aboutAppVisible: boolean
}

export default class SettingsManager extends React.Component<{}, SettingsManagerState> {
    private static async onClickQuit() {
        await ipcRequest(QUIT_APPLICATION_CHANNEL, {}, false)
    }

    constructor(props: {}) {
        super(props)

        this.state = {
            backCLicked: false,
            startOnLogin: false,
            autoUpdate: false,
            isLoaded: false,
            aboutAppVisible: false
        }

        this.onChangeStartOnLogin = this.onChangeStartOnLogin.bind(this)
        this.onChangeAutoUpdate = this.onChangeAutoUpdate.bind(this)
        this.onClickBack = this.onClickBack.bind(this)
    }

    async componentDidMount(): Promise<void> {
        const [startOnLogin, autoUpdate] = await Promise.all([
            ipcRequest<{}, GetStartOnLoginIpcResponse>(GET_START_ON_LOGIN, {}),
            ipcRequest<{}, GetAutoUpdateIpcResponse>(GET_AUTO_UPDATE, {})
        ])
        this.setState({
            startOnLogin: startOnLogin.startOnLogin ?? false,
            autoUpdate: autoUpdate.autoUpdate,
            isLoaded: true
        })
    }

    private async onChangeStartOnLogin(shouldStart: boolean) {
        this.setState({ startOnLogin: shouldStart })
        await ipcRequest<SetStartOnLoginIpcParams, {}>(
            SET_START_ON_LOGIN,
            { startOnLogin: shouldStart },
            false
        )
    }

    private async onChangeAutoUpdate(autoUpdate: boolean) {
        this.setState({ autoUpdate })
        await ipcRequest<SetAutoUpdateIpcParams, {}>(SET_AUTO_UPDATE, { autoUpdate }, false)
    }

    private onClickBack() {
        this.setState({ backCLicked: true })
    }

    render(): React.ReactNode {
        if (this.state.backCLicked) {
            return <Redirect to="/" />
        }
        if (!this.state.isLoaded) {
            return <div />
        }
        return (
            <Settings
                onClickBack={this.onClickBack}
                onClickStartOnLoginSwitch={this.onChangeStartOnLogin}
                onClickAutoUpdateSwitch={this.onChangeAutoUpdate}
                openAboutApp={() => this.setState({ aboutAppVisible: true })}
                closeAboutApp={() => this.setState({ aboutAppVisible: false })}
                shouldStartOnLogin={this.state.startOnLogin}
                autoUpdate={this.state.autoUpdate}
                onClickQuit={SettingsManager.onClickQuit}
                aboutAppVisible={this.state.aboutAppVisible}
            />
        )
    }
}
