import { combineReducers } from 'redux'

import { counterReducer, CounterState } from './counterReducer'

export interface RootState {
    counter: CounterState
}

export const rootReducer = combineReducers<RootState | undefined>({
    counter: counterReducer
})
