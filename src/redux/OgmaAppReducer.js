/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';

import {environmentReducer} from './EnvironmentReducer';
import {DefaultEnvRoutePath, DefaultTagSearchCondition, ReduxActions} from '../util/typedef';

const initialGlobalState = {
    client: {
        id: null,
        localClient: false,
    },
    connectionMap: {},

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
    if (!action.envId && data && data.id) action.envId = data.id;

    if (type === ReduxActions.SetClientDetails) {
        return {
            ...state,
            client: {
                ...state.client,
                ...data,
            },
        };
    } else if (type === ReduxActions.SetConnectionList) {
        const connectionMap = {};
        for (const conn of data) {
            connectionMap[conn.id] = conn;
        }
        return {
            ...state,
            connectionMap,
        };
    } else if (type === ReduxActions.AddConnection) {
        const connectionMap = {...state.connectionMap};
        connectionMap[data.id] = data;
        return {
            ...state,
            connectionMap,
        };
    } else if (type === ReduxActions.RemoveConnection) {
        const connectionMap = {...state.connectionMap};
        delete connectionMap[data];
        return {
            ...state,
            connectionMap,
        };
    } else if (type === ReduxActions.UpdateSummaries) {
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
                entityMap: {},
                fileMap: {},
                tabBrowse: {path: '/'},
                tabSearch: {selectedTagsMap: {}, tagFilter: '', tagSearchCondition: DefaultTagSearchCondition},
            };
            env.summary = summary;
            newEnvMap[summary.id] = env;
        }

        return {
            ...state,
            envIds: newEnvIds,
            envMap: newEnvMap,
        };
    } else if (action.envId) {
        const envId = action.envId;
        const newEnvMap = {
            ...state.envMap,
            [envId]: environmentReducer(state.envMap[envId], action),
        };
        return {
            ...state,
            envMap: newEnvMap,
        };
    } else if (window.isDevelopment && type !== '@@INIT') {
        console.warn(`[Redux] Non-global action called without 'envId': ${type}`);
    }
    return state;
};

export default ogmaAppReducer;
