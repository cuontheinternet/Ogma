/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import {createReducer} from 'redux-starter-kit';

import {DefaultEnvRoutePath, ReduxActions} from '../typedef';

const initialGlobalState = {
    envIds: [],
    envMap: {},
};

const environmentReducer = createReducer({}, {
    [ReduxActions.UpdateSummary]: (state, action) => {
        return {...state, summary: action.data};
    },
    [ReduxActions.SetAllTags]: (state, action) => {
        const tags = action.data;
        const tagIds = new Array(tags.length);
        const tagMap = {};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            tagIds[i] = tag.id;
            tagMap[tag.id] = tag;
        }
        return {...state, tagIds, tagMap};
    },
    [ReduxActions.AddNewTags]: (state, action) => {
        const tags = action.data;
        const newTagIds = new Array(tags.length);
        const tagMap = {...state.tagMap};
        for (let i = 0; i < tags.length; ++i) {
            const tag = tags[i];
            newTagIds[i] = tag.id;
            tagMap[tag.id] = tag;
        }
        return {...state, tagIds: _.union(state.tagIds, newTagIds), tagMap};
    },
    [ReduxActions.TagFiles]: (state, action) => {
        const {hashes, entityIds, tagIds} = action.data;
        const fileMap = {...state.tagTab.fileMap};
        for (let i = 0; i < hashes.length; ++i) {
            const hash = hashes[i];
            const oldFile = fileMap[hash];
            if (!oldFile) continue;
            fileMap[hash] = {
                ...oldFile,
                entityId: entityIds[i],
                tagIds: _.union(oldFile.tagIds, tagIds),
            };
        }
        return {...state, tagTab: {...state.tagTab, fileMap}};
    },
    [ReduxActions.UpdateEnvSubRoute]: (state, action) => {
        return {...state, subRoute: action.data};
    },
    [ReduxActions.TagTabChangeData]: (state, action) => {
        return {...state, tagTab: {...state.tagTab, ...action.data}};
    },
    [ReduxActions.TagTabRemoveFiles]: (state, action) => {
        const tagTab = state.tagTab;
        const deletedHashes = action.data;

        const fileHashes = _.difference(tagTab.fileHashes, deletedHashes);
        if (fileHashes.length === tagTab.fileHashes.length) return state;

        const fileMap = {...tagTab.fileMap};
        for (const hash of deletedHashes) delete fileMap[hash];
        return {...state, tagTab: {...state.tagTab, fileHashes, fileMap}};
    },
});

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
            const env = state.envMap[summary.id] || {
                id: summary.id,
                subRoute: DefaultEnvRoutePath,
                tagIds: [],
                tagMap: {},
                tagTab: {path: '/', fileHashes: [], fileMap: {}},
            };
            env.summary = summary;
            newEnvMap[summary.id] = env;
        }

        return {
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
    }

    if (window.isDevelopment && type !== '@@INIT') {
        console.warn(`[Redux] Non-global action called without 'envId': ${type}`);
    }
    return state;
};

export default ogmaAppReducer;
