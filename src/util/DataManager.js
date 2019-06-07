/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import Denque from 'denque';
import Promise from 'bluebird';

import {BackendEvents, ReduxActions} from './typedef';
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

        this.lastThumbRequestEnvId = '';
        this.thumbRequestQueue = new Denque();
        this._debounceRequestBatchThumbnails = _.debounce(this._requestBatchThumbnails, 100);
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
            [BackendEvents.EnvThumbUpdates]: data => this.dispatch(ReduxActions.UpdateThumbStates, data.id, data),
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
            .then(() => Promise.all([this._fetchAllTags(), this._fetchAllEntities()]));
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
        this.dispatch(ReduxActions.RemoveMultipleFiles, data.id, data.hashes);
    };

    _fetchAllTags() {
        const envIds = this.store.getState().envIds;
        const promises = _.map(envIds, id => window.ipcModule.getAllTags({id}));
        return Promise.all(promises)
            .then(allAllTags => _.zipWith(envIds, allAllTags, (envId, allTags) => this._setAllTags(envId, allTags)));
    }

    _setAllTags = (envId, allTags) => {
        this.dispatch(ReduxActions.SetAllTags, envId, allTags);
    };

    _fetchAllEntities() {
        const envIds = this.store.getState().envIds;
        const promises = _.map(envIds, id => window.ipcModule.getAllEntities({id}));
        return Promise.all(promises)
            .then(allAllEntities => _.zipWith(envIds, allAllEntities, (envId, allEntities) => this._setAllEntities(envId, allEntities)));
    }

    _setAllEntities = (envId, allEntities) => {
        this.dispatch(ReduxActions.SetAllEntities, envId, allEntities);
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
     * @param {boolean} data.wasCached Available
     */
    requestDirectoryContent(data) {
        if (data.wasCached) {
            // TODO: Do some re-fetching or updates on the directory in the future.
            return Promise.resolve();
        }

        return window.ipcModule.getDirectoryContents({id: data.id, path: data.path})
            .then(result => {
                const {directory, files} = result;
                this.dispatch(ReduxActions.SetMultipleFileDetails, data.id, files);

                const actionData = {directory, files: _.map(files, f => f.hash)};
                this.dispatch(ReduxActions.SetDirectoryContent, data.id, actionData);
                return null;
            });
    }

    _requestBatchThumbnails() {
        const newDenque = new Denque();
        const envId = this.lastThumbRequestEnvId;
        const requestQueue = this.thumbRequestQueue;
        this.thumbRequestQueue = newDenque;

        window.ipcModule.requestFileThumbnails({id: envId, paths: requestQueue.toArray()});
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.path Relative path of the file (from environment root)
     */
    requestFileThumbnail(data) {
        this.lastThumbRequestEnvId = data.id;
        this.thumbRequestQueue.push(data.path);
        this._debounceRequestBatchThumbnails();
    }

    /**
     * @param {object} data
     * @param {string} data.id Environment ID
     * @param {string} data.hashes File hashes that came from entities
     */
    getEntityFiles(data) {
        const chunks = _.chunk(data.hashes, 75);
        const promises = chunks.map(ch => window.ipcModule.getEntityFiles({id: data.id, hashes: ch}));
        return Promise.all(promises)
            .then(chunks => {
                const entityFiles = _.flattenDeep(chunks);
                this.dispatch(ReduxActions.SetMultipleFileDetails, data.id, entityFiles);
                return null;
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
