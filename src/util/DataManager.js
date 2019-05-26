/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import Promise from 'bluebird';

import ModalUtil from './ModalUtil';
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
            const callback = result => {
                resolve(result);
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
                    return this.requestSocketAction({name: 'create-environment'})
                        .then(outcome => console.log(outcome));
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
