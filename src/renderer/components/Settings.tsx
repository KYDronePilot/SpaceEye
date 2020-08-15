import * as React from 'react'
import { Link, Redirect } from 'react-router-dom'
import styled from 'styled-components'

import { QUIT_APPLICATION_CHANNEL } from '../../shared/IpcDefinitions'
import { ipcRequest } from '../IpcService'
import Button from './Button'

interface SettingsState {
    backCLicked: boolean
}

export default class Settings extends React.Component<{}, SettingsState> {
    /**
     * Close the application window.
     */
    private static async closeWindow() {
        await ipcRequest(QUIT_APPLICATION_CHANNEL, {}, false)
    }

    constructor(props: {}) {
        super(props)

        this.state = {
            backCLicked: false
        }

        this.onClickBack = this.onClickBack.bind(this)
    }

    private onClickBack() {
        this.setState({ backCLicked: true })
    }

    public render() {
        if (this.state.backCLicked) {
            return <Redirect to="/" />
        }

        return (
            <div>
                <Button onClick={() => this.onClickBack()}>Back</Button>
                <Button onClick={() => Settings.closeWindow()}>Quit</Button>
            </div>
        )
    }
}
