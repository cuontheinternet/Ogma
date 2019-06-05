/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';

import {environmentReducer} from './EnvironmentReducer';
import {DefaultEnvRoutePath, ReduxActions} from '../util/typedef';

const initialGlobalState = {
    envIds: [],
    envMap: {},
};

/**
 * @param {object} state
 * @param {ReduxAction} action
 * @returns {object}
 */
const ogmaAppReducer = (state = initialGlobalState, action) => {
    const {type, data} = action;

    if (type === ReduxActions.UpdateSummaries) {
        const newSummaries = data;
        const newEnvIds = _.map(newSummaries, s => s.id);
        const newEnvMap = {};
        for (let i = 0; i < newSummaries.length; ++i) {
            const summary = newSummaries[i];
            const oldEnv = state.envMap[summary.id];
            const env = oldEnv ? {...oldEnv} : {
                id: summary.id,
                subRoute: DefaultEnvRoutePath,
                tagIds: [],
                tagMap: {},
                fileMap: {},
                tagTab: {path: '/'},
            };
            env.summary = summary;
            newEnvMap[summary.id] = env;
        }

        return {
            envIds: newEnvIds,
            envMap: newEnvMap,
        };
    }

    if (!action.envId && data && data.id) action.envId = data.id;
    if (action.envId) {
        const envId = action.envId;
        const newEnvMap = {
            ...state.envMap,
            [envId]: environmentReducer(state.envMap[envId], action),
        };
        return {
            ...state,
            envMap: newEnvMap,
        };
    }

    if (window.isDevelopment && type !== '@@INIT') {
        console.warn(`[Redux] Non-global action called without 'envId': ${type}`);
    }
    return state;
};

export default ogmaAppReducer;
