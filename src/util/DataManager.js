/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import Promise from 'bluebird';
import {EventEmitter} from 'events';

import {BackendEvents} from '../typedef';
import ErrorHandler, {UserFriendlyError} from './ErrorHandler';

export const DMEvents = {
    UpdateEnvSummaries: 'update-env-summaries',
};

class DataManager {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {HelloResponse} data.serverResponse
     */
    constructor(data) {
        this.socket = data.socket;
        this.localClient = data.serverResponse.localClient;

        this.envSummaries = [];
        this.emitter = new EventEmitter();
    }

    init() {
        // Setup reconnect logic
        this.socket.on('connect', () => {
            this._syncBaseState()
                .catch(ErrorHandler.handleMiscError);
        });

        // Setup logic for forwarded event
        const forwardEventHandlers = {};
        forwardEventHandlers[BackendEvents.UpdateEnvSummaries] = this._setEnvSummaries;
        this.socket.on('forward-event', eventInfo => {
            const eventHandler = forwardEventHandlers[eventInfo.name];
            if (eventHandler !== undefined) {
                eventHandler.apply(this, eventInfo.args);
            }
        });

        // Attempt initial sync
        return this._syncBaseState();
    }

    /**
     * @param {object} data
     * @param {string} data.name
     * @param {*} [data.data]
     * @returns {Promise<any>}
     */
    _requestSocketAction(data) {
        return new Promise((resolve, reject) => {

            // Setup callback logic
            const callback = response => {
                if (response.error) {
                    reject(new UserFriendlyError({
                        title: 'Server-side error',
                        message: `Server has encountered an error: "${response.error}"`,
                    }));
                } else {
                    resolve(response.result);
                }
            };

            // Send request to server
            this.socket.emit('action', data.name, data.data, callback);
        });
    }

    _syncBaseState() {
        return Promise.resolve()
            .then(() => this._fetchEnvSummaries());
    }

    _fetchEnvSummaries() {
        return this._requestSocketAction({name: 'get-env-summaries'})
            .then(this._setEnvSummaries);
    }

    _setEnvSummaries = (envSummaries) => {
        this.envSummaries = envSummaries;
        this.emitter.emit(DMEvents.UpdateEnvSummaries, this.envSummaries);
    };

    isLocalClient() {
        return this.localClient;
    }

    createNewEnvironment() {
        return Promise.resolve()
            .then(() => {
                if (this.localClient) {
                    return this._requestSocketAction({name: 'create-environment'});
                } else {
                    throw new UserFriendlyError({
                        title: 'Permission denied',
                        message: 'Sorry, this action is only available in Local version of Ogma.',
                    });
                }
            });
    }


    getEnvSummaries() {
        return this.envSummaries;
    }


    subscribe(event, listener) {
        this.emitter.addListener(event, listener);
    }

    unsubscribe(event, listener) {
        this.emitter.removeListener(event, listener);
    }

}

export default DataManager;
