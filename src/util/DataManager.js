/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import Promise from 'bluebird';

import {UserFriendlyError} from './ErrorHandler';

class DataManager {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {HelloResponse} data.serverResponse
     */
    constructor(data) {
        this.socket = data.socket;
        this.localClient = data.serverResponse.localClient;
    }

    /**
     * @param {object} data
     * @param {string} data.name
     * @param {*} [data.data]
     * @returns {Promise<any>}
     */
    requestSocketAction(data) {
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

    isLocalClient() {
        return this.localClient;
    }

    createNewEnvironment() {
        return Promise.resolve()
            .then(() => {
                if (this.localClient) {
                    return this.requestSocketAction({name: 'create-environment'});
                } else {
                    throw new UserFriendlyError({
                        title: 'Permission denied',
                        message: 'Sorry, this action is only available in Local version of Ogma.',
                    });
                }
            });
    }

}

export default DataManager;
