/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2019
 * @license GPL-3.0
 */

import Swal from 'sweetalert2';

const CustomSwal = Swal.mixin({animation: false});

class ModalUtil {

    /**
     * @param {object} data
     * @param {string} [data.title]
     * @param {string} data.message
     * @returns {Promise<SweetAlertResult>}
     */
    static showError(data) {
        return CustomSwal.fire({
            title: data.title ||'Error!',
            text: data.message,
            type: 'error',
            confirmButtonText: 'Cool',
        });
    }

}

export default ModalUtil;
