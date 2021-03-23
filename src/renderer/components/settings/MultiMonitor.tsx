import {
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Radio,
    RadioGroup,
    Typography
} from '@material-ui/core'
import * as React from 'react'

import { MultiMonitorMode } from '../../../shared'

interface RadioOptionProps {
    value: string
    label: string
}

const RadioOption: React.FC<RadioOptionProps> = props => {
    const { value, label } = props
    return (
        <FormControlLabel
            value={value}
            control={<Radio color="primary" />}
            label={<Typography color="textPrimary">{label}</Typography>}
        />
    )
}

const explanations = {
    [MultiMonitorMode.independent]:
        'Views are set on each monitor independently (open the SpaceEye app window on the monitor you want to change)',
    [MultiMonitorMode.unified]: 'The selected satellite view is displayed on all monitors'
}

interface MultiMonitorSettingProps {
    mode: MultiMonitorMode
    onChange: (mode: MultiMonitorMode) => void
}

export const MultiMonitorSetting: React.FC<MultiMonitorSettingProps> = props => {
    const { mode, onChange } = props
    return (
        <FormControl component="fieldset">
            <FormLabel component="legend" focused={false}>
                Multi-Monitor Support
            </FormLabel>
            <RadioGroup
                row
                name="multi-monitor-support"
                value={mode}
                onChange={event => {
                    if (event.target.value === MultiMonitorMode.independent) {
                        onChange(MultiMonitorMode.independent)
                    } else {
                        onChange(MultiMonitorMode.unified)
                    }
                }}
            >
                <RadioOption value={MultiMonitorMode.unified} label="Unified" />
                <RadioOption value={MultiMonitorMode.independent} label="Independent" />
            </RadioGroup>
            <FormHelperText>{explanations[mode]}</FormHelperText>
        </FormControl>
    )
}
