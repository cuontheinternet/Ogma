/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import Promise from 'bluebird';

import {BackendEvents, FrontendEvents} from '../typedef';
import ErrorHandler from './ErrorHandler';

class DataManager {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {ConnectionDetails} data.connDetails
     */
    constructor(data) {
        this.socket = data.socket;
        this.localClient = data.connDetails.localClient;

        this.envSummaries = [];
        this.envRoutePathMap = {};
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
        const listenerMap = {};
        listenerMap[BackendEvents.UpdateEnvSummaries] = this._setEnvSummaries;
        listenerMap[BackendEvents.UpdateEnvSummary] = this._setEnvSummary;
        listenerMap[BackendEvents.EnvAddTags] = this._addNewTags;
        this.emitter.on('*', function (...args) {
            const eventName = this.event;
            const listener = listenerMap[eventName];
            if (!listener) return;
            listener(...args);
        });

        // Attempt initial sync
        return this._syncBaseState();
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

    _setEnvSummaries = summary => {
        this.envSummaries = summary;
        // TODO: Delete tag maps and such if an environment is deleted.
    };

    _setEnvSummary = summary => {
        const index = _.findIndex(this.envSummaries, s => s.id === summary.id);
        if (index === -1) this.envSummaries.push(summary);
        else this.envSummaries[index] = summary;
    };

    getEnvSummaries() {
        return this.envSummaries;
    }

    _fetchAllTags() {
        const envIds = _.map(this.envSummaries, s => s.id);
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
    };

    _addNewTags = data => {
        const tagMap = this.allTagMaps[data.id];
        const tagArray = this.allTagArrays[data.id];
        for (const tag of data.tags) {
            if (tagMap[tag.id]) tagArray.push(tag);
            tagMap[tag.id] = tag;
        }
        this.emitter.emit(FrontendEvents.NewAllTags, {id: data.id, allTags: tagArray});
    };

    /**
     * @param {object} data
     * @param {string} data.id
     */
    getAllTags(data) {
        return this.allTagArrays[data.id];
    }

    getTagDetails = (envId, tagId) => {
        return this.allTagMaps[envId][tagId];
    };

    /**
     * @param {object} data
     * @param {string} data.id
     * @param {string} data.path
     */
    setEnvRoutePath(data) {
        this.envRoutePathMap[data.id] = data.path;
    }

    /**
     * @param {object} data
     * @param {string} data.id
     */
    getEnvRoutePath(data) {
        return this.envRoutePathMap[data.id];
    }

    isLocalClient() {
        return this.localClient;
    }

    // noinspection JSMethodCanBeStatic
    isElectron() {
        return navigator.userAgent.includes('Electron/');
    }

    subscribe(event, listener) {
        this.emitter.addListener(event, listener);
    }

    unsubscribe(event, listener) {
        this.emitter.removeListener(event, listener);
    }

}

export default DataManager;
