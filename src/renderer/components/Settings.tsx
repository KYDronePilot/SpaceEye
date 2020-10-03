import { FormControl, FormControlLabel, Switch, withStyles } from '@material-ui/core'
import { createMuiTheme } from '@material-ui/core/styles'
import { ThemeProvider } from '@material-ui/styles'
import * as React from 'react'
import { Redirect } from 'react-router-dom'
import styled from 'styled-components'

import {
    GET_START_ON_BOOT,
    GetStartOnBootIpcResponse,
    QUIT_APPLICATION_CHANNEL,
    SET_START_ON_BOOT,
    SetStartOnBootIpcParams
} from '../../shared/IpcDefinitions'
import { ipcRequest } from '../IpcService'

interface SettingsState {
    backCLicked: boolean
    startOnReboot: boolean
}

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

const StyledLabel = withStyles({
    label: {
        color: 'white'
    }
})(FormControlLabel)

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            main: '#0075ff'
        }
    }
})

const SettingsSwitch: React.FC<SettingsSwitchProps> = props => {
    const { label, isChecked, onChange } = props
    return (
        <ThemeProvider theme={theme}>
            <FormControl component="fieldset">
                <StyledLabel
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
                    classes={{ label: 'color: white;' }}
                />
            </FormControl>
        </ThemeProvider>
    )
}

interface SettingsManagerState {
    backCLicked: boolean
    startOnReboot: boolean
    isLoaded: boolean
}

export default class SettingsManager extends React.Component<{}, SettingsManagerState> {
    private static async onClickQuit() {
        await ipcRequest(QUIT_APPLICATION_CHANNEL, {}, false)
    }

    constructor(props: {}) {
        super(props)

        this.state = {
            backCLicked: false,
            startOnReboot: false,
            isLoaded: false
        }

        this.onChangeStartOnLogin = this.onChangeStartOnLogin.bind(this)
        this.onClickBack = this.onClickBack.bind(this)
    }

    async componentDidMount(): Promise<void> {
        const response = await ipcRequest<{}, GetStartOnBootIpcResponse>(GET_START_ON_BOOT, {})
        this.setState({ startOnReboot: response.startOnBoot ?? false }, () => {
            this.setState({ isLoaded: true })
        })
    }

    private async onChangeStartOnLogin(shouldStart: boolean) {
        this.setState({ startOnReboot: shouldStart })
        await ipcRequest<SetStartOnBootIpcParams, {}>(
            SET_START_ON_BOOT,
            { startOnBoot: shouldStart },
            false
        )
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
                shouldStartOnLogin={this.state.startOnReboot}
                onClickQuit={SettingsManager.onClickQuit}
            />
        )
    }
}

interface SettingsProps {
    onClickBack: () => void
    onClickQuit: () => void
    onClickStartOnLoginSwitch: (shouldStart: boolean) => void
    shouldStartOnLogin: boolean
}

const Settings: React.FC<SettingsProps> = props => {
    const { onClickBack, onClickQuit, onClickStartOnLoginSwitch, shouldStartOnLogin } = props

    return (
        <SettingsContainer>
            <SectionsContainer>
                <SectionsColumn>
                    <Row>
                        <Spacer />
                        <ProductTitle>SpaceEye alpha</ProductTitle>
                        <Spacer />
                    </Row>
                    <Row>
                        <Spacer />
                        <BackButton onClick={onClickBack}>Back</BackButton>
                        <Spacer />
                    </Row>
                    <Spacer />
                    <Row>
                        <Spacer />
                        <QuitButton onClick={onClickQuit}>Quit</QuitButton>
                        <Spacer />
                    </Row>
                </SectionsColumn>
            </SectionsContainer>
            <SettingsColumn>
                <Row>
                    <Spacer />
                    <SettingsHeader>Settings</SettingsHeader>
                    <Spacer />
                </Row>
                <Row>
                    <SettingsSwitch
                        isChecked={shouldStartOnLogin}
                        onChange={onClickStartOnLoginSwitch}
                        label="Start on Login"
                    />
                    <Spacer />
                </Row>
            </SettingsColumn>
        </SettingsContainer>
    )
}
