/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import Promise from 'bluebird';

import {BackendEvents, ReduxActions} from '../typedef';
import ErrorHandler from './ErrorHandler';

export default class DataManager {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {object} data.store
     * @param {ConnectionDetails} data.connDetails
     */
    constructor(data) {
        this.socket = data.socket;
        this.store = data.store;
        this.localClient = data.connDetails.localClient;

        this.emitter = window.proxyEmitter;

        this.allTagMaps = {};
        this.allTagArrays = {};
    }

    init() {
        // Setup reconnect logic
        this.socket.on('connect', () => {
            this._syncBaseState()
                .catch(ErrorHandler.handleMiscError);
        });

        // Setup listeners
        const listenerMap = {
            [BackendEvents.UpdateEnvSummaries]: this._setEnvSummaries,
            [BackendEvents.UpdateEnvSummary]: this._setEnvSummary,
            [BackendEvents.EnvRemoveFiles]: this._removeFiles,
            [BackendEvents.EnvAddTags]: data => this.dispatch(ReduxActions.AddNewTags, data.id, data.tags),
            [BackendEvents.EnvTagFiles]: data => this.dispatch(ReduxActions.TagFiles, data.id, data),
            [BackendEvents.EnvUntagFiles]: data => this.dispatch(ReduxActions.UntagFiles, data.id, data),
            [BackendEvents.EnvThumbUpdate]: data => this.dispatch(ReduxActions.TagTabThumbUpdate, data.id, data),
        };
        this.emitter.on('*', function (...args) {
            const eventName = this.event;
            const listener = listenerMap[eventName];
            if (!listener) return;
            listener(...args);
        });

        // Attempt initial sync
        return this._syncBaseState();
    }

    dispatch(...args) {
        const type = args[0];
        let envId;
        let data;
        if (args.length === 2) {
            data = args[1];
        } else {
            envId = args[1];
            data = args[2];
        }
        this.store.dispatch({type, envId, data});
    }

    _syncBaseState() {
        return Promise.resolve()
            .then(() => this._fetchEnvSummaries())
            .then(() => this._fetchAllTags());
    }

    _fetchEnvSummaries() {
        return window.ipcModule.getSummaries()
            .then(this._setEnvSummaries);
    }

    _setEnvSummaries = summaries => {
        this.dispatch(ReduxActions.UpdateSummaries, summaries);
    };

    _setEnvSummary = summary => {
        this.dispatch(ReduxActions.UpdateSummary, summary.id, summary);
    };

    _removeFiles = data => {
        this.dispatch(ReduxActions.TagTabRemoveFiles, data.id, data.hashes);
    };

    _fetchAllTags() {
        const envIds = this.store.getState().envIds;
        const promises = _.map(envIds, id => window.ipcModule.getAllTags({id}));
        return Promise.all(promises)
            .then(allAllTags => _.zipWith(envIds, allAllTags, (envId, allTags) => this._setAllTags(envId, allTags)));
    }

    _setAllTags = (envId, allTags) => {
        const tagMap = {};
        for (const tag of allTags) {
            tagMap[tag.id] = tag;
        }
        this.allTagMaps[envId] = tagMap;
        this.allTagArrays[envId] = allTags;
        this.dispatch(ReduxActions.SetAllTags, envId, allTags);
    };

    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Sub route (URL) of the environment
     */
    setEnvRoutePath(data) {
        this.dispatch(ReduxActions.UpdateEnvSubRoute, data.id, data.path);
    }

    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Path relative to environment route
     */
    changeTagTabPath(data) {
        return window.ipcModule.getDirectoryContents({id: data.id, path: data.path})
            .then(files => {
                const fileHashes = new Array(files.length);
                const fileMap = {};
                for (let i = 0; i < files.length; ++i) {
                    const file = files[i];
                    fileHashes[i] = file.hash;
                    fileMap[file.hash] = file;
                }
                const tabData = {
                    path: data.path,
                    fileHashes,
                    fileMap,
                };
                this.dispatch(ReduxActions.TagTabChangeData, data.id, tabData);
            });
    }

    isLocalClient() {
        return this.localClient;
    }

    // noinspection JSMethodCanBeStatic
    isElectron() {
        return navigator.userAgent.includes('Electron/');
    }

}
