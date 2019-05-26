/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */
import ModalUtil from './ModalUtil';

class DataManager {

    /**
     * @param {object} data
     * @param {object} data.socket
     * @param {HelloResponse} data.serverResponse
     */
    constructor(data) {
        this.localClient = data.serverResponse.localClient;
    }

    isLocalClient() {
        return this.localClient;
    }

    createNewEnvironment() {
        if (this.localClient) {

        } else {
            ModalUtil.showError({
                title: 'Permission denied.',
                message: 'Sorry, this action is only available in Local version of Ogma.',
            });
        }
    }

}

export default DataManager;
