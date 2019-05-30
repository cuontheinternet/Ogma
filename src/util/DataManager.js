/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import _ from 'lodash';
import Promise from 'bluebird';

import ErrorHandler from './ErrorHandler';
import {BackendEvents, FrontendEvents} from '../typedef';

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
        this.emitter = window.frontendEmitter;
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
        window.backendEmitter.on('*', function (...args) {
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
            .then(() => this._fetchEnvSummaries());
    }

    _fetchEnvSummaries() {
        return window.ipcModule.getEnvSummaries()
            .then(this._setEnvSummaries);
    }

    _setEnvSummaries = summary => {
        this.envSummaries = summary;
        this.emitter.emit(FrontendEvents.UpdateEnvSummaries, this.envSummaries);
    };

    _setEnvSummary = summary => {
        const index = _.findIndex(this.envSummaries, s => s.id === summary.id);
        if (index === -1) this.envSummaries.push(summary);
        else this.envSummaries[index] = summary;

        this.emitter.emit(FrontendEvents.UpdateEnvSummary, summary);
        this.emitter.emit(FrontendEvents.UpdateEnvSummaries, this.envSummaries);
    };

    getEnvSummaries() {
        return this.envSummaries;
    }

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

    subscribe(event, listener) {
        this.emitter.addListener(event, listener);
    }

    unsubscribe(event, listener) {
        this.emitter.removeListener(event, listener);
    }

    isLocalClient() {
        return this.localClient;
    }

    // noinspection JSMethodCanBeStatic
    isElectron() {
        return navigator.userAgent.includes('Electron/');
    }

}

export default DataManager;
