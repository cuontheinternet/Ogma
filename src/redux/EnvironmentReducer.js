/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license LGPL-3.0
 */

import _ from 'lodash';
import ExactTrie from 'exact-trie';
import {createReducer} from 'redux-starter-kit';

import {ReduxActions} from '../util/typedef';
import Util from '../util/Util';

export const environmentReducer = createReducer({}, {
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
        const fileMap = {...state.fileMap};
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
        return {...state, fileMap};
    },
    [ReduxActions.UntagFiles]: (state, action) => {
        const {entityIds, tagIds} = action.data;
        const fileMap = {...state.fileMap};
        const entityTrie = new ExactTrie({ignoreCase: false}).putAll(entityIds, true);
        const untaggedFiles = _.filter(fileMap, f => f.entityId && entityTrie.has(f.entityId));
        for (let i = 0; i < untaggedFiles.length; ++i) {
            const file = untaggedFiles[i];
            const remainingTags = _.difference(file.tagIds, tagIds);
            fileMap[file.hash] = {
                ...file,
                tagIds: remainingTags,
            };
        }
        return {...state, fileMap};
    },

    [ReduxActions.SetDirectoryContent]: (state, action) => {
        const {directory: dir, files} = action.data;
        const fileMap = {...state.fileMap};
        const oldDir = fileMap[dir.hash];
        fileMap[dir.hash] = {
            ...oldDir,
            fileHashes: files,
        };
        return {...state, fileMap};
    },
    [ReduxActions.SetMultipleFileDetails]: (state, action) => {
        const files = action.data;
        const fileMap = {...state.fileMap};
        for (const file of files) {
            fileMap[file.hash] = {
                ...fileMap[file.hash],
                ...file,
            };
        }
        return {...state, fileMap};
    },
    [ReduxActions.RemoveMultipleFiles]: (state, action) => {
        const deletedHashes = action.data;

        const dirHashMap = {};
        const fileMap = {...state.fileMap};
        for (const fileHash of deletedHashes) {
            const file = fileMap[fileHash];
            if (file) {
                const nixPath = file.nixPath;
                const dirPath = nixPath.substring(0, nixPath.length - file.base.length - 1);
                const dirHash = Util.getFileHash(dirPath === '' ? '/' : dirPath);

                if (dirHashMap[dirHash]) dirHashMap[dirHash].push(fileHash);
                else dirHashMap[dirHash] = [fileHash];
            }
            delete fileMap[fileHash];
        }

        for (const dirHash in dirHashMap) {
            if (!dirHashMap.hasOwnProperty(dirHash)) continue;
            const directory = fileMap[dirHash];
            if (!directory) continue;
            const fileHashes = directory.fileHashes;
            if (!fileHashes) continue;

            fileMap[dirHash] = {
                ...directory,
                fileHashes: _.difference(fileHashes, dirHashMap[dirHash]),
            };
        }

        return {...state, fileMap};
    },
    [ReduxActions.UpdateThumbState]: (state, action) => {
        const {hash, thumb} = action.data;
        const oldFileMap = state.fileMap;

        let newState = state;
        const oldFile = oldFileMap[hash];
        if (oldFile) {
            newState = {
                ...state,
                fileMap: {
                    ...oldFileMap,
                    [hash]: {...oldFile, thumb},
                },
            };
        }
        return newState;
    },

    [ReduxActions.UpdateEnvSubRoute]: (state, action) => {
        return {...state, subRoute: action.data};
    },
    [ReduxActions.TagTabChangePath]: (state, action) => {
        const newPath = action.data;
        return {...state, tagTab: {...state.tagTab, path: newPath}};
    },
});

